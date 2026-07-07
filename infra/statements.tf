# Faz 4: kredi kartı ekstresi yükleme + OpenAI ile harcama çıkarımı.
#
# Akış: tarayıcı presigned URL ile PDF'i doğrudan S3'e yükler -> S3 ObjectCreated event'i
# processor Lambda'yı tetikler -> processor SSM'den OpenAI key'ini okur, PDF'i OpenAI'ye
# gönderir, çıkan işlemleri DynamoDB'ye yazar.
#
# OpenAI API key BİLEREK bir Terraform kaynağı DEĞİL — infra/README.md'deki adımlarla
# `aws ssm put-parameter` ile elle konur. Böylece hiçbir zaman Terraform state'ine ya da bu
# koda yazılmaz.

resource "aws_s3_bucket" "statements" {
  bucket = "${var.project_name}-statements-${data.aws_caller_identity.current.account_id}"
}

# Presigned URL ile tarayıcıdan doğrudan PUT yapılabilmesi için gerekli — S3 bucket'ları
# varsayılan olarak CORS izni vermez, bu olmadan tarayıcı isteği "Failed to fetch" ile
# engeller (aynı origin listesi API Gateway'de de kullanılıyor, bkz. lambda_api.tf).
resource "aws_s3_bucket_cors_configuration" "statements" {
  bucket = aws_s3_bucket.statements.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = var.cors_allowed_origins
    allowed_headers = ["content-type"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "statements" {
  bucket = aws_s3_bucket.statements.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SSE-S3 (AWS'nin kendi anahtarı) — customer-managed/KMS DEĞİL, bu hesaptaki bilinen KMS
# decrypt sorununu (bkz. lambda_api.tf'teki not) burada da yaşamamak için.
resource "aws_s3_bucket_server_side_encryption_configuration" "statements" {
  bucket = aws_s3_bucket.statements.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "processor_lambda" {
  name = "${var.project_name}-statement-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_cloudwatch_log_group" "processor_lambda" {
  name              = "/aws/lambda/${var.project_name}-statement-processor"
  retention_in_days = 14
}

resource "aws_iam_role_policy" "processor_lambda_logs" {
  name = "${var.project_name}-statement-processor-logs"
  role = aws_iam_role.processor_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.processor_lambda.arn}:*"
    }]
  })
}

resource "aws_iam_role_policy" "processor_lambda_s3" {
  name = "${var.project_name}-statement-processor-s3"
  role = aws_iam_role.processor_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.statements.arn}/*"
    }]
  })
}

resource "aws_iam_role_policy" "processor_lambda_dynamodb" {
  name = "${var.project_name}-statement-processor-dynamodb"
  role = aws_iam_role.processor_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:BatchWriteItem"]
      Resource = aws_dynamodb_table.portfolio.arn
    }]
  })
}

resource "aws_iam_role_policy" "processor_lambda_ssm" {
  name = "${var.project_name}-statement-processor-ssm"
  role = aws_iam_role.processor_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/openai-api-key"
    }]
  })
}

data "archive_file" "processor" {
  type        = "zip"
  source_dir  = "${path.module}/../apps/api/dist/processor"
  output_path = "${path.module}/../apps/api/dist/processor.zip"
}

resource "aws_lambda_function" "statement_processor" {
  function_name    = "${var.project_name}-statement-processor"
  role             = aws_iam_role.processor_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.processor.output_path
  source_code_hash = data.archive_file.processor.output_base64sha256
  timeout          = 90 # OpenAI çağrısı + çok sayfalı PDF için pay
  memory_size      = 256

  depends_on = [aws_cloudwatch_log_group.processor_lambda]
}

resource "aws_lambda_permission" "s3_invoke_processor" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.statement_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.statements.arn
}

resource "aws_s3_bucket_notification" "statements" {
  bucket = aws_s3_bucket.statements.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.statement_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "statements/"
    filter_suffix       = ".pdf"
  }

  depends_on = [aws_lambda_permission.s3_invoke_processor]
}
