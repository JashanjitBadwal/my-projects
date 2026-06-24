from kubernetes import client, config

from app.models import ResourceKind, UtilizationProfile


def _parse_cpu(quantity: str) -> float:
    """Convert a Kubernetes CPU quantity (e.g. '500m', '2') to cores."""
    if quantity.endswith("m"):
        return float(quantity[:-1]) / 1000
    return float(quantity)


def collect(kube_config_path: str | None = None) -> list[UtilizationProfile]:
    """Compare requested vs. actual CPU usage for workloads across all namespaces."""
    if kube_config_path:
        config.load_kube_config(config_file=kube_config_path)
    else:
        config.load_kube_config()

    core_v1 = client.CoreV1Api()
    metrics_api = client.CustomObjectsApi()

    profiles: list[UtilizationProfile] = []
    pods = core_v1.list_pod_for_all_namespaces(watch=False)

    usage_by_pod: dict[str, float] = {}
    try:
        usage = metrics_api.list_cluster_custom_object(
            group="metrics.k8s.io", version="v1beta1", plural="pods"
        )
        for item in usage.get("items", []):
            pod_name = item["metadata"]["name"]
            total_cpu = sum(_parse_cpu(c["usage"]["cpu"]) for c in item.get("containers", []))
            usage_by_pod[pod_name] = total_cpu
    except client.ApiException:
        pass  # metrics-server not installed; usage data unavailable

    for pod in pods.items:
        requested_cpu = sum(
            _parse_cpu(c.resources.requests.get("cpu", "0"))
            for c in pod.spec.containers
            if c.resources and c.resources.requests
        )
        actual_cpu = usage_by_pod.get(pod.metadata.name)
        avg_cpu_pct = (actual_cpu / requested_cpu * 100) if actual_cpu is not None and requested_cpu else None

        profiles.append(
            UtilizationProfile(
                resource_id=f"{pod.metadata.namespace}/{pod.metadata.name}",
                kind=ResourceKind.K8S_WORKLOAD,
                region="n/a",
                monthly_cost_usd=0.0,
                avg_cpu_pct=avg_cpu_pct,
                metadata={"requested_cpu_cores": requested_cpu, "actual_cpu_cores": actual_cpu},
            )
        )
    return profiles
