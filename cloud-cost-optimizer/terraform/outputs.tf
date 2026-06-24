output "reader_role_arn" {
  description = "ARN of the IAM role the backend assumes to read AWS utilization/cost data"
  value       = aws_iam_role.cost_optimizer_reader.arn
}
