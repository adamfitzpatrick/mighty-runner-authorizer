

variable "function_name" {
    description = "Name of authorizer function as deployed to AWS"
    default     = "authorizer-lambda"
}

variable "dynamo_table_arn" {
    description = "ARN used for restricting lambda access to a specific dynamo table"
    default     = "*"
}

variable "table_name" {
    description = "DynamoDB table against which the authorizer checks tokens"
}

variable "primary_key_column_name" {
    description = "Primary key name for the DynamoDB source table"
}

variable "region" {
    description = "AWS region"
    default     = "us-west-2"
}

variable "cloudwatch_log_retention_in_days" {
    description = "Amount of time to retain log data"
    default     = "365"
}