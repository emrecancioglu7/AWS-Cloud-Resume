output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.admin.id
}

output "cognito_app_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.portfolio.name
}

output "api_base_url" {
  description = "Frontend'in çağıracağı backend API'nin taban URL'i"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
