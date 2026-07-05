# Faz 2: backend API iskeleti. İki route var:
#   GET /health     — auth yok, basit bir canlılık kontrolü.
#   GET /portfolio  — Cognito JWT authorizer ile korunur, DynamoDB'deki fon listesini döner
#                     (Faz 3'teki TEFAS scraper veri yazana kadar boş liste döner).
#
# `terraform apply` etmeden önce apps/api içinde `npm run build` çalıştırılmış olmalı —
# aşağıdaki archive_file, apps/api/dist klasörünü zipler.

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../apps/api/dist"
  output_path = "${path.module}/../apps/api/dist.zip"
}

resource "aws_iam_role" "api_lambda" {
  name = "${var.project_name}-api-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_cloudwatch_log_group" "api_lambda" {
  name              = "/aws/lambda/${var.project_name}-api"
  retention_in_days = 14 # ücretsiz katmanda sınırsız log birikmesin diye
}

# En az yetki: sadece kendi log grubuna yazabilir, tüm CloudWatch Logs'a değil.
resource "aws_iam_role_policy" "api_lambda_logs" {
  name = "${var.project_name}-api-lambda-logs"
  role = aws_iam_role.api_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.api_lambda.arn}:*"
    }]
  })
}

# En az yetki: sadece bu tek tabloya (ve GSI'larına) okuma/yazma, başka hiçbir DynamoDB kaynağına değil.
resource "aws_iam_role_policy" "api_lambda_dynamodb" {
  name = "${var.project_name}-api-lambda-dynamodb"
  role = aws_iam_role.api_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
      ]
      Resource = [
        aws_dynamodb_table.portfolio.arn,
        "${aws_dynamodb_table.portfolio.arn}/index/*",
      ]
    }]
  })
}

# Not: Bu hesaptaki varsayılan Lambda KMS anahtarı (alias/aws/lambda) ortam değişkenlerini
# decrypt ederken execution role'e rağmen KMSAccessDeniedException veriyor (bu hesaba özgü bir
# davranış). Ücretli bir customer-managed key kurmak yerine, fonksiyonun hiç ortam değişkeni
# kullanmamasını tercih ediyoruz — tablo adı apps/api/src/dynamo.ts içinde sabit (bkz. o dosyadaki
# not). Böylece KMS decrypt adımı hiç devreye girmiyor, sorun ve olası maliyet ortadan kalkıyor.
resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.api_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 10
  memory_size      = 256

  depends_on = [aws_cloudwatch_log_group.api_lambda]
}

# REST API yerine HTTP API: daha ucuz ve bu basit proxy kullanım şekli için yeterli.
resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET"]
    allow_headers = ["authorization", "content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  # Kişisel bir site için düşük trafik bekleniyor — kaza/kötüye kullanım kaynaklı
  # beklenmedik faturalamayı önlemek için mütevazı bir üst sınır.
  default_route_settings {
    throttling_rate_limit  = 10
    throttling_burst_limit = 5
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http.id
  name             = "cognito"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.admin.id}"
  }
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "portfolio" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "GET /portfolio"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
