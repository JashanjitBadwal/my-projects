terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # REPLACE_ME-tfstate must be created out-of-band before first init; this
  # stack and us-west-2 use independent state so they can be applied in
  # parallel with no cross-region dependency.
  backend "s3" {
    bucket = "REPLACE_ME-tfstate"
    key    = "multi-region-sre/us-east-1/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source = "../../modules/vpc"
  region = "us-east-1"
  name   = "sre-platform-use1"
}

module "eks" {
  source             = "../../modules/eks"
  name               = "sre-platform-use1"
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
