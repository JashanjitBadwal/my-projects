# Incident Response

## Severities

| Severity | Definition | Example | Response time |
|---|---|---|---|
| SEV1 | Both regions down, or overall uptime SLO breached | Total outage | Page immediately, 24/7 |
| SEV2 | One region down, other region absorbing traffic normally | Single-region health-check failure | Page immediately, 24/7 |
| SEV3 | Degraded but within SLO | Latency SLO breach in one region | Business-hours triage |
| SEV4 | No user impact | Slow burn-rate warning | Ticket, no page |

## Detection

Alerts fire from `monitoring/prometheus/alerts.yml`:
- `RegionDown` — a region's `/healthz` probe fails for 1m → SEV2 (or SEV1 if both regions trip it).
- `SLOFastBurn` — SEV1/SEV2 page.
- `SLOSlowBurn` — SEV3/SEV4, no page.
- `LatencySLOBreach` — SEV3.

## Response process

1. **Acknowledge** the page within 5 minutes.
2. **Check the SLO dashboard** (`monitoring/grafana/dashboards/slo-dashboard.json`) to confirm scope: one region or both, latency or full outage.
3. **Confirm DNS failover behavior:**
   - `dig api.example.com` — confirm Route53 is no longer returning the unhealthy region's alias target.
   - If it's still returning the bad region after >60s, check `aws route53 get-health-check-status --health-check-id <id>` — Route53-side detection may be stuck.
4. **If a single region is down** and DNS has correctly failed over: the other region is absorbing 100% of traffic. Verify its HPA/node group has headroom (`kubectl top pods`, `kubectl get hpa`) — it needs to handle 2x normal load. Scale node group manually if autoscaling lags.
5. **If both regions are down or DNS hasn't failed over:** escalate to SEV1, follow `docs/disaster-recovery.md`.
6. **Mitigate** — restart pods, roll back a bad deploy, or manually drain the health check (`aws route53 update-health-check` is not needed; Route53 reacts automatically to the `/healthz` probe — the fix is to make `/healthz` pass again).
7. **Resolve** — confirm both regions healthy and SLO dashboard green for 15 minutes before closing.

## Escalation

- Primary on-call → secondary on-call after 10 minutes unacknowledged.
- SEV1 → notify engineering lead immediately.
- Any incident that touches the failover path itself (Route53, health checks) → notify the SRE platform owner regardless of severity, since it affects the safety net for future incidents.

## Postmortem

Required for SEV1/SEV2. Include: timeline, detection lag (alert fire time vs actual impact start), whether the automated failover worked as designed, and any error-budget consumed.
