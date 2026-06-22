📁 [multi-region-sre-platform](./multi-region-sre-platform) — Multi-Region SRE Platform
An active-active demo service running on EKS across two AWS regions (us-east-1, us-west-2), built to exercise core SRE practices: SLOs, automated failover, and disaster recovery.


Routing: Route53 latency-based routing with health-check failover (no manual intervention on single-region outage)
Infrastructure: Terraform modules for VPC, EKS, and Route53, split into per-region and global stacks
Deployment: Kustomize base + per-region overlays (Deployment, Service, HPA, PDB)
Monitoring: Prometheus scrape config and burn-rate alerts, with Grafana SLO dashboards
Targets: 99.9% uptime SLO, p99 latency < 300ms, RTO < 5 min, RPO 0
Docs: SLOs, incident response, and disaster-recovery runbooks under docs/
