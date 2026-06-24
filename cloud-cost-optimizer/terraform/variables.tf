variable "aws_region" {
  description = "AWS region to deploy supporting infra into"
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefix applied to all created resource names"
  type        = string
  default     = "cloud-cost-optimizer"
}
