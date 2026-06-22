# Disaster Recovery

## Scope

The service is stateless (no database, no persistent volumes), so DR here is about **region loss**, not data loss.

- **RPO: 0.** No state to lose — each region runs identical, independently-deployable infrastructure from the same Terraform/Kustomize sources.
- **RTO: < 5 minutes**, achieved without human intervention via Route53 health-check failover:
  - Health check interval: 10s, failure threshold: 3 → detection in ~30s.
  - DNS record TTL is controlled by the alias record (inherits ALB's, effectively near-zero for alias records) → clients re-resolve quickly.
  - End-to-end: traffic stops flowing to a failed region within roughly 30-60 seconds of it failing `/healthz`.

## Failure scenarios and procedures

### 1. Single region fully down (AZ/region outage, EKS control plane issue, etc.)

**Automatic:** Route53 stops routing to the unhealthy region once 3 consecutive health checks fail. No action required for traffic to keep flowing.

**Manual follow-up:**
1. Confirm via the SLO dashboard that the surviving region is handling 100% of traffic and is within capacity (HPA should scale up automatically; verify with `kubectl get hpa -n default`).
2. If the node group needs more headroom than HPA + cluster autoscaler provide fast enough, manually bump `node_desired_size` in `terraform/envs/<region>/main.tf` for the surviving region and apply.
3. Do not attempt to repair the failed region under live pressure — focus on the survivor's capacity first.

### 2. Both regions down simultaneously

This is outside the design assumptions of DNS failover (there's nowhere to fail over to). Treat as SEV1:
1. Identify whether the cause is shared (e.g. a bad app deploy pushed to both regions, a shared upstream dependency, IAM/credential expiry) vs. coincidental.
2. If it's a bad deploy: `kubectl rollout undo deployment/sre-demo-app -k app/k8s/overlays/<region>` in both regions.
3. If infrastructure-level: rebuild from Terraform (`terraform apply` in `terraform/envs/us-east-1` and `terraform/envs/us-west-2` are independent and can run in parallel) — there is no cross-region dependency in the regional stacks, only `terraform/envs/global` depends on both.

### 3. Total loss of a region's infrastructure (e.g. account-level issue, need to rebuild from scratch)

1. `terraform apply` in the affected region's `terraform/envs/<region>` directory — VPC, EKS, and node group are fully defined as code with no manual steps.
2. Re-deploy the app: `kubectl apply -k app/k8s/overlays/<region>`.
3. Update `terraform/envs/global`'s `alb_endpoints` var with the new ALB DNS name/zone ID for that region and `terraform apply` — this re-registers the Route53 health check and latency record.
4. Confirm the region rejoins rotation once its health check passes (no DNS propagation delay beyond the health-check interval, since it's an alias record).

## DR drill cadence

Recommend quarterly: simulate a region failure by scaling a region's node group to 0 (or applying a network policy that blocks `/healthz`) and confirming Route53 fails over within the RTO target, then restore and confirm fail-back.
