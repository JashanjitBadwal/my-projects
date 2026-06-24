from datetime import datetime, timedelta

import boto3

from app.models import ResourceKind, UtilizationProfile

LOOKBACK_DAYS = 14


def collect(region: str) -> list[UtilizationProfile]:
    """Collect utilization profiles for EBS volumes, flagging unattached (idle) ones."""
    ec2 = boto3.client("ec2", region_name=region)
    cloudwatch = boto3.client("cloudwatch", region_name=region)

    profiles: list[UtilizationProfile] = []
    paginator = ec2.get_paginator("describe_volumes")
    for page in paginator.paginate():
        for volume in page["Volumes"]:
            volume_id = volume["VolumeId"]
            is_attached = len(volume.get("Attachments", [])) > 0

            avg_iops = None
            if is_attached:
                end = datetime.utcnow()
                start = end - timedelta(days=LOOKBACK_DAYS)
                response = cloudwatch.get_metric_statistics(
                    Namespace="AWS/EBS",
                    MetricName="VolumeReadOps",
                    Dimensions=[{"Name": "VolumeId", "Value": volume_id}],
                    StartTime=start,
                    EndTime=end,
                    Period=3600,
                    Statistics=["Average"],
                )
                datapoints = response.get("Datapoints", [])
                if datapoints:
                    avg_iops = sum(dp["Average"] for dp in datapoints) / len(datapoints)

            profiles.append(
                UtilizationProfile(
                    resource_id=volume_id,
                    kind=ResourceKind.STORAGE_VOLUME,
                    region=region,
                    monthly_cost_usd=0.0,  # filled in by the cost collector
                    avg_iops=avg_iops,
                    is_idle=not is_attached,
                    metadata={"size_gb": volume["Size"], "volume_type": volume["VolumeType"]},
                )
            )
    return profiles
