### 📁 [multi-region-sre-platform](./multi-region-sre-platform) — Multi-Region SRE Platform

An active-active demo service running on EKS across two AWS regions (`us-east-1`, `us-west-2`), built to exercise core SRE practices: SLOs, automated failover, and disaster recovery.

- **Routing:** Route53 latency-based routing with health-check failover
- **Infrastructure:** Terraform modules for VPC, EKS, and Route53
- **Deployment:** Kustomize base + per-region overlays (Deployment, Service, HPA, PDB)
- **Monitoring:** Prometheus burn-rate alerts with Grafana SLO dashboards
- **Targets:** 99.9% uptime SLO, p99 latency < 300ms, RTO < 5 min, RPO 0
- **Docs:** SLOs, incident response, and disaster-recovery runbooks under `docs/`

### 📁 [circleci-pipeline-demo](./circleci-pipeline-demo) — CircleCI Reference Pipeline

A minimal Flask + PostgreSQL service ("widget-service") built to drive a CircleCI pipeline that demonstrates a custom in-pipeline Docker build, a Postgres sidecar, conditional execution, and a keyless OIDC publish to AWS.

- **App:** Flask API backed by PostgreSQL, with `/health` and `/widgets` endpoints
- **Pipeline:** CircleCI 2.1 with a custom Docker image built in-pipeline and a Postgres sidecar container for integration tests
- **Smart builds:** `path-filtering` orb runs jobs only when relevant files change
- **Testing:** pytest with JUnit-formatted results collected by CircleCI
- **Secure publish:** OIDC-authenticated upload to **AWS S3** that runs only on merge to `main` — no static AWS keys stored anywhere
- **Tooling:** Helper scripts for running tests, waiting on Postgres, and publishing artifacts

