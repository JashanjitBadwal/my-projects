terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Least-privilege role the backend assumes to read utilization/cost data.
# No write/mutate permissions are granted here by design — actions stay
# human-approved outside this platform.
resource "aws_iam_role" "cost_optimizer_reader" {
  name = "${var.name_prefix}-reader"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cost_optimizer_reader_policy" {
  name = "${var.name_prefix}-reader-policy"
  role = aws_iam_role.cost_optimizer_reader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Read"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeReservedInstances",
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchRead"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
        ]
        Resource = "*"
      },
      {
        Sid    = "CostExplorerRead"
        Effect = "Allow"
        Action = [
          "ce:GetCostAndUsage",
          "ce:GetReservationUtilization",
          "ce:GetSavingsPlansUtilization",
        ]
        Resource = "*"
      },
      {
        Sid    = "S3Read"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation",
          "s3:GetBucketLifecycleConfiguration",
        ]
        Resource = "*"
      },
    ]
  })
}

module "ec2_analyzer" {
  source = "./modules/ec2-analyzer"

  name_prefix    = var.name_prefix
  reader_role_arn = aws_iam_role.cost_optimizer_reader.arn
}
