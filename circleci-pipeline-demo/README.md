# widget-service — CircleCI reference pipeline

A minimal Flask + Postgres service whose only real purpose is to drive a CircleCI
pipeline that demonstrates: a custom Docker image built in-pipeline, a Postgres
sidecar container, JUnit-collected test results, conditional execution via
path-filtering, and an OIDC-authenticated publish step to AWS S3 that only runs
on merge to `main`.

## Local dev

```
python3 -m venv .venv && . .venv/bin/activate
pip install -r app/requirements.txt
docker run -d --name widget-postgres -p 5432:5432 \
  -e POSTGRES_DB=circleci_demo -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine
DB_HOST=localhost bash scripts/run_tests.sh
```

## One-time setup to get a green CircleCI build

1. **Push this repo to GitHub** (public repo, since CircleCI needs to reach it
   and the brief calls for a public VCS repo).
   ```
   git init   # if not already a repo
   git add .
   git commit -m "Add CircleCI reference pipeline"
   git remote add origin https://github.com/<you>/widget-service.git
   git push -u origin main
   ```

2. **Connect the repo in CircleCI**
   - Go to https://app.circleci.com → Projects → "Set Up Project" → pick the
     repo → choose "Use existing config" since `.circleci/config.yml` is
     already committed.

3. **Create the AWS OIDC trust (no static AWS keys are stored anywhere)**
   - In AWS IAM → Identity providers → Add provider:
     - Provider type: OpenID Connect
     - Provider URL: `https://oidc.circleci.com/org/<YOUR_CIRCLECI_ORG_ID>`
       (find your org ID in CircleCI → Organization Settings → Overview)
     - Audience: `<YOUR_CIRCLECI_ORG_ID>`
   - Create an IAM role that trusts that provider, scoped with a condition on
     `oidc.circleci.com/org/<ORG_ID>:sub` matching your specific project/context
     (CircleCI's OIDC docs give the exact subject claim format). Attach a
     policy that allows `s3:PutObject` on the artifact bucket only.

4. **Create an S3 bucket** for artifacts, e.g. `widget-service-artifacts-<you>`.

5. **In CircleCI, create a context** named `aws-oidc-publish` (Organization
   Settings → Contexts) and add two environment variables to it:
   - `AWS_OIDC_ROLE_ARN` = the IAM role ARN from step 3
   - `AWS_REGION` = e.g. `us-east-1`
   - `ARTIFACT_BUCKET` = the bucket name from step 4

   Using a context (rather than project env vars) means the publish job's
   credentials are only available to builds that are explicitly granted that
   context, and only the `publish` job references it — `build-image` and
   `test` never see it.

6. **Open a PR** that touches `app/` — confirm the pipeline runs
   `path-filtering/filter`, routes into `build-image` → `test`, and that
   `publish` is *skipped* (branch filter blocks it on a non-default branch).

7. **Merge to `main`** — confirm `publish` now runs and uploads
   `widget-service-<sha>.zip` to S3, authenticated purely via the OIDC-assumed
   role (visible in the job logs — no `AWS_SECRET_ACCESS_KEY` ever appears).

Once green, capture:
- The repo URL
- The passing build URL (CircleCI → Pipelines → click the green run → copy URL)

and drop them into `WRITEUP.md`.
