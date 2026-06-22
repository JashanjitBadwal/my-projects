variable "domain_name" {
  type        = string
  description = "Apex domain managed by the hosted zone, e.g. example.com"
}

variable "record_name" {
  type        = string
  description = "Subdomain to create the failover/latency record set under, e.g. api.example.com"
}

variable "regions" {
  description = "Map of region key -> { endpoint = ALB DNS name, zone_id = ALB hosted zone id, aws_region = AWS region }"
  type = map(object({
    endpoint   = string
    zone_id    = string
    aws_region = string
  }))
}

resource "aws_route53_zone" "this" {
  name = var.domain_name
}

resource "aws_route53_health_check" "region" {
  for_each = var.regions

  fqdn              = each.value.endpoint
  port              = 443
  type              = "HTTPS"
  resource_path     = "/healthz"
  failure_threshold = 3
  request_interval  = 10

  tags = {
    Name = "${each.key}-healthz"
  }
}

resource "aws_route53_record" "latency" {
  for_each = var.regions

  zone_id        = aws_route53_zone.this.zone_id
  name           = var.record_name
  type           = "A"
  set_identifier = each.key

  latency_routing_policy {
    region = each.value.aws_region
  }

  health_check_id = aws_route53_health_check.region[each.key].id

  alias {
    name                   = each.value.endpoint
    zone_id                = each.value.zone_id
    evaluate_target_health = true
  }
}

output "zone_id" {
  value = aws_route53_zone.this.zone_id
}

output "name_servers" {
  value = aws_route53_zone.this.name_servers
}

output "health_check_ids" {
  value = { for k, v in aws_route53_health_check.region : k => v.id }
}
