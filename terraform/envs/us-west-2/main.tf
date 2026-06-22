terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Mirrors us-east-1's stack with its own state key/region — independent
  # state means this region can be applied, destroyed, or rebuilt without
  # touching the other region.
  backend "s3" {
    bucket = "REPLACE_ME-tfstate"
    key    = "multi-region-sre/us-west-2/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source = "../../modules/vpc"
  region = "us-west-2"
  name   = "sre-platform-usw2"
}

module "eks" {
  source             = "../../modules/eks"
  name               = "sre-platform-usw2"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
