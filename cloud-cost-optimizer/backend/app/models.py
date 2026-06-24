from enum import Enum

from pydantic import BaseModel


class ResourceKind(str, Enum):
    EC2_INSTANCE = "ec2_instance"
    K8S_WORKLOAD = "k8s_workload"
    STORAGE_VOLUME = "storage_volume"


class UtilizationProfile(BaseModel):
    resource_id: str
    kind: ResourceKind
    region: str
    monthly_cost_usd: float
    avg_cpu_pct: float | None = None
    avg_memory_pct: float | None = None
    avg_iops: float | None = None
    is_idle: bool = False
    metadata: dict = {}


class Recommendation(BaseModel):
    resource_id: str
    kind: ResourceKind
    action: str  # e.g. "rightsize", "purchase_reserved_instance", "delete_idle"
    rationale: str
    estimated_monthly_savings_usd: float
    confidence: float
