# Multi-Region SRE Platform

Active-active demo service running on EKS in two AWS regions (`us-east-1`, `us-west-2`), fronted by Route53 latency-based routing with health-check failover. Built to exercise core SRE practices: SLOs, automated failover, and disaster recovery.

## Architecture

```
                     Route53 (latency routing + health checks)
                       /                              \
              us-east-1 EKS                    us-west-2 EKS
              (active)                          (active)
                |                                   |
          Deployment (3 replicas)            Deployment (3 replicas)
          /healthz, /readyz                  /healthz, /readyz
                |                                   |
          Prometheus -----------------------> Grafana (SLO dashboard)
```

Both regions serve live traffic (active-active). Route53 health checks probe each region's `/healthz` endpoint every 10s; if a region fails 3 consecutive checks, Route53 stops routing traffic to it within ~30-40s. No manual failover step is required for a single-region outage.

## Repo layout

- `terraform/modules/vpc` — per-region VPC, subnets, NAT
- `terraform/modules/eks` — EKS cluster + managed node group per region
- `terraform/modules/route53` — health checks + latency-based record sets
- `terraform/envs/us-east-1`, `terraform/envs/us-west-2` — region stacks (VPC + EKS)
- `terraform/envs/global` — Route53 hosted zone, health checks, DNS records (depends on both regional stacks for ALB endpoints)
- `app/src` — sample stateless API (Python, stdlib `http.server`) with `/healthz`, `/readyz`, `/`
- `app/k8s/base` — Kustomize base manifests (Deployment, Service, HPA, PDB)
- `app/k8s/overlays/<region>` — per-region patches (replica count, region label)
- `monitoring/prometheus` — scrape config + alerting rules (SLO burn-rate alerts)
- `monitoring/grafana/dashboards` — SLO dashboard JSON (uptime, latency, error budget)
- `docs/slo.md` — uptime/latency targets and how they're measured
- `docs/incident-response.md` — on-call process, severities, escalation
- `docs/disaster-recovery.md` — region-loss DR procedure and RTO/RPO targets

## Deploy order

1. `terraform/envs/us-east-1` and `terraform/envs/us-west-2` (parallel — independent VPC+EKS)
2. Deploy `app/k8s` to both clusters via `kubectl apply -k app/k8s/overlays/<region>`
3. `terraform/envs/global` (Route53 — needs both regions' ALB DNS names as outputs)
4. Apply `monitoring/prometheus` and import `monitoring/grafana/dashboards` into Grafana

## Targets

- **Uptime SLO:** 99.9% monthly (≈43m/month error budget) — see [docs/slo.md](docs/slo.md)
- **Latency SLO:** p99 < 300ms — see [docs/slo.md](docs/slo.md)
- **RTO:** < 5 minutes (automated, DNS-based) — see [docs/disaster-recovery.md](docs/disaster-recovery.md)
- **RPO:** 0 (stateless service, no data loss possible) — see [docs/disaster-recovery.md](docs/disaster-recovery.md)
