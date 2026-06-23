# Reference pipeline: widget-service

**Repo:** `<FILL IN — e.g. https://github.com/you/widget-service>`
**Passing build:** `<FILL IN — e.g. https://app.circleci.com/pipelines/github/you/widget-service/12/workflows/...>`

## What it does

`widget-service` is a small Flask API backed by Postgres. The app itself is
intentionally simple — it exists to give the pipeline something real to build,
test, and ship. The pipeline:

1. Builds a custom Docker image from the repo's `Dockerfile` (Python 3.12 +
   the app + a `wait-for-postgres.sh` entrypoint), entirely inside the CircleCI
   job — nothing is pulled pre-built.
2. Spins up a Postgres sidecar container and runs the test suite *inside the
   just-built image*, against that sidecar, over a private Docker network.
3. Collects JUnit + coverage XML so results show up natively in the CircleCI
   UI (Tests tab, flaky-test detection, timing data) instead of just console
   logs.
4. Only continues to build/test/publish when relevant files actually changed
   — checked via the `path-filtering` orb against the diff from `main` —
   so unrelated commits (docs, etc.) short-circuit into a no-op pipeline.
5. On merge to `main` only, zips the release artifact and uploads it to S3,
   authenticating via CircleCI's OIDC token exchanged for a short-lived AWS
   IAM role. No AWS access keys exist anywhere in CircleCI's environment
   variables or contexts.

## Architecture

```
                         ┌─────────────────────────┐
 push / PR ──trigger──▶  │ setup-and-route workflow │
                         │  path-filtering/filter   │
                         └──────────┬──────────────┘
                                    │ sets pipeline parameter run-build=true
                                    │ only if app/, scripts/, Dockerfile,
                                    │ or .circleci/ changed
                                    ▼
                         ┌─────────────────────────┐
                         │ build-test-publish       │
                         │  workflow (continuation) │
                         └──────────┬──────────────┘
                 ┌──────────────────┼───────────────────────┐
                 ▼                  ▼                       ▼
         build-image job       test job                 publish job
   docker build + save   machine executor:           cimg/aws executor:
   custom image, persist  - docker load image          - aws-cli/setup with
   tar to workspace        - run postgres:16-alpine      role_arn from OIDC
                             sidecar on a docker        - zip app + upload
                             network                      to S3
                           - run pytest *inside the      branch filter: main
                             custom image* against        only
                             the sidecar                requires: context
                           - store_test_results /        aws-oidc-publish
                             store_artifacts
```

### How the components map together

| Requirement | Implementation |
|---|---|
| Public VCS repo connected to CircleCI | GitHub repo above, connected via "Set Up Project" |
| Custom Docker image built during the pipeline | `build-image` job runs `docker build` against the repo's `Dockerfile`, no pre-built base pulled from a registry beyond the Python base layer |
| Testing with collectible results | `test` job runs `pytest --junitxml=...`, surfaced via `store_test_results` |
| Database via sidecar | `postgres:16-alpine` container started alongside the app container on a dedicated Docker network inside the `test` job (machine executor + `setup_remote_docker` pattern) |
| Conditional execution | `path-filtering/filter` orb computes a `run-build` pipeline parameter from the diff against `main`; the entire build/test/publish workflow is gated on it via `when:` |
| Shell + non-scripting language | Bash (`wait-for-postgres.sh`, `publish_artifact.sh`, inline `run:` steps) + Python (Flask app, pytest suite) |
| Artifact published to IaaS | Release zip uploaded to S3 |
| Publish only on merge to default branch | `publish` job has `filters: branches: only: main` |
| Credentials not accessible outside approved builds | AWS role ARN lives in a CircleCI **context** (`aws-oidc-publish`) referenced only by the `publish` job — `build-image` and `test` never see it, and no job has static AWS keys at all |
| OIDC | `aws-cli/setup` exchanges CircleCI's OIDC ID token for short-lived AWS credentials via an IAM OIDC identity provider trust — no long-lived secret ever stored in CircleCI |

## Unique value / optimizations leveraging CircleCI features

- **Pipeline-parameter continuation + path-filtering** avoids burning compute
  (and, on a paid plan, credits) on full image builds and Postgres-backed
  test runs for changes that can't affect the service — e.g. a README edit.
  This is the same pattern used to fan out monorepo builds, scaled down to a
  single-service example.
- **`setup_remote_docker` + `docker_layer_caching`** means the custom image's
  base layers are cached between runs, so iterating on the app code doesn't
  pay the full `pip install` cost every build.
- **Workspace persistence** (`persist_to_workspace` / `attach_workspace`)
  passes the exact image built and tested forward, rather than rebuilding it
  in a later job — what gets tested is bit-for-bit what would get published.
- **Contexts scope credentials to specific jobs**, not the whole pipeline —
  the `test` job has no AWS access at all, shrinking the blast radius if that
  job were ever compromised by a malicious PR.
- **OIDC removes long-lived AWS secrets entirely.** Nothing to rotate, nothing
  to leak via a misconfigured log line or a forked-PR build.
- **`store_test_results`** makes failures triageable from the CircleCI UI
  (per-test timing, history, flaky-test flagging) instead of grepping raw
  console output.

## Potential future optimizations / trade-offs

- **Registry push instead of re-running `docker build`.** Currently the image
  is built once and saved/loaded via workspace; for a larger service, pushing
  to ECR (also via OIDC) and pulling by digest in later jobs would scale
  better than passing a `.tar` through workspace storage.
- **Matrix testing** across Python versions or Postgres versions, if the
  service needed to support more than one, using a `matrix:` job config.
- **Migrate to `docker` executor with a `postgres` service container** instead
  of `machine` executor + manual `docker network create`. The `machine`
  executor was used here so the *custom* image could run as a peer container
  on the same network as the sidecar; a `docker` executor with native
  "secondary service container" support is lighter-weight if the test runner
  doesn't itself need to be a Docker-in-Docker context.
- **Tighten the OIDC trust policy** to a specific CircleCI project ID and
  branch (`sub` claim), not just the org, to reduce the blast radius of a
  stolen pipeline trigger.
- **Add a rollback/verify step** post-publish (e.g. smoke-test the uploaded
  artifact) before considering the deploy fully complete — currently the
  pipeline ends at "uploaded," not "verified live."
