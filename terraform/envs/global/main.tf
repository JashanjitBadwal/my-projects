terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "REPLACE_ME-tfstate"
    key    = "multi-region-sre/global/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "example.com"
}

# ALB DNS name / zone ID per region come from each region's k8s Service
# (AWS Load Balancer Controller) annotations or `kubectl get svc -o json`
# output after the app is deployed. Populate these as data sources or
# tfvars once the regional ALBs exist.
variable "alb_endpoints" {
  type = map(object({
    endpoint   = string
    zone_id    = string
    aws_region = string
  }))
}

module "dns" {
  source      = "../../modules/route53"
  domain_name = var.domain_name
  record_name = "api.${var.domain_name}"
  regions     = var.alb_endpoints
}

output "name_servers" {
  value = module.dns.name_servers
}

output "health_check_ids" {
  value = module.dns.health_check_ids
}
