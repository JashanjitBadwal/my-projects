variable "name_prefix" {
  type = string
}

variable "reader_role_arn" {
  description = "ARN of the IAM role granted read access to EC2/CloudWatch/Cost Explorer"
  type        = string
}

# Scheduled trigger that kicks off a collection run on a fixed cadence.
# The actual collector code lives in backend/app/collectors and is invoked
# out-of-band (e.g. as a container task) — this module only owns the schedule.
resource "aws_cloudwatch_event_rule" "scheduled_collection" {
  name                = "${var.name_prefix}-scheduled-collection"
  description         = "Triggers a cost/utilization collection run"
  schedule_expression = "rate(6 hours)"
}
