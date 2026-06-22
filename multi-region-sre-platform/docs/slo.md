# SLOs

## Uptime

- **Target:** 99.9% monthly availability, measured per-region and overall (overall = at least one region healthy).
- **Error budget:** 43m 50s/month.
- **Measurement:** `blackbox_exporter` probes `/healthz` in each region every 15s (`monitoring/prometheus/prometheus.yml`). Uptime = `avg_over_time(probe_success[30d])`.
- **Burn-rate alerting** (`monitoring/prometheus/alerts.yml`):
  - Fast burn: 14.4x rate over 1h, 5m sustained → pages on-call (budget exhausted in ~2 days at that rate).
  - Slow burn: 6x rate over 6h, 30m sustained → warning, business-hours investigation (budget exhausted in ~5 days).

## Latency

- **Target:** p99 < 300ms for `/healthz` (proxy for overall request latency in this demo, since the sample app has no real business logic).
- **Measurement:** `probe_duration_seconds{job="blackbox-region-healthz"}`.
- **Alert:** sustained breach for 5m fires `LatencySLOBreach` (warning).

## Dashboard

`monitoring/grafana/dashboards/slo-dashboard.json` — import into Grafana. Panels:
- Uptime by region (30d rolling)
- Error budget remaining (30d, 99.9% target)
- Probe latency vs 300ms target
- Region health timeline (binary up/down)
- Active pod count per region

## Why these targets

99.9% (not 99.99%) and a single-digit-second health-check interval were chosen so that DNS-based failover (Route53, ~30-40s detection + TTL) can plausibly stay inside the error budget for a single-region outage without requiring active-active session draining or anycast. If a tighter SLO is needed, the failover mechanism would need to move from DNS to something faster (e.g. Global Accelerator or an Anycast LB).
