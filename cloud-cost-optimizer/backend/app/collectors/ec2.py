from datetime import datetime, timedelta

import boto3

from app.models import ResourceKind, UtilizationProfile

LOOKBACK_DAYS = 14
IDLE_CPU_THRESHOLD_PCT = 5.0


def _avg_cpu_pct(cloudwatch, instance_id: str) -> float | None:
    end = datetime.utcnow()
    start = end - timedelta(days=LOOKBACK_DAYS)

    response = cloudwatch.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=start,
        EndTime=end,
        Period=3600,
        Statistics=["Average"],
    )
    datapoints = response.get("Datapoints", [])
    if not datapoints:
        return None
    return sum(dp["Average"] for dp in datapoints) / len(datapoints)


def collect(region: str) -> list[UtilizationProfile]:
    """Collect utilization profiles for all running EC2 instances in a region."""
    ec2 = boto3.client("ec2", region_name=region)
    cloudwatch = boto3.client("cloudwatch", region_name=region)

    profiles: list[UtilizationProfile] = []
    paginator = ec2.get_paginator("describe_instances")
    for page in paginator.paginate(Filters=[{"Name": "instance-state-name", "Values": ["running"]}]):
        for reservation in page["Reservations"]:
            for instance in reservation["Instances"]:
                instance_id = instance["InstanceId"]
                avg_cpu = _avg_cpu_pct(cloudwatch, instance_id)

                profiles.append(
                    UtilizationProfile(
                        resource_id=instance_id,
                        kind=ResourceKind.EC2_INSTANCE,
                        region=region,
                        monthly_cost_usd=0.0,  # filled in by the cost collector
                        avg_cpu_pct=avg_cpu,
                        is_idle=avg_cpu is not None and avg_cpu < IDLE_CPU_THRESHOLD_PCT,
                        metadata={"instance_type": instance["InstanceType"]},
                    )
                )
    return profiles
