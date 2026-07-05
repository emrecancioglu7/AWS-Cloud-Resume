# Tek admin kullanıcılı Cognito User Pool.
# Self-signup kapalı, TOTP tabanlı MFA zorunlu (SMS MFA kullanılmıyor — ücretsiz katmanda kalmak için).
resource "aws_cognito_user_pool" "admin" {
  name = "${var.project_name}-admin"

  # Halka açık kayıt yok — kullanıcı sadece admin tarafından (bu Terraform ile) oluşturulur.
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  mfa_configuration = "ON"
  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  auto_verified_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }
}

# SPA (apps/web) için app client — client secret yok (public client).
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-web-client"
  user_pool_id = aws_cognito_user_pool.admin.id

  generate_secret                     = false
  explicit_auth_flows                 = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors       = "ENABLED"
  access_token_validity               = 1
  id_token_validity                   = 1
  refresh_token_validity              = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# Tek admin kullanıcısı. Geçici şifre ilk girişte değiştirilecek şekilde ayarlanır.
resource "aws_cognito_user" "admin" {
  user_pool_id   = aws_cognito_user_pool.admin.id
  username       = var.admin_email
  temporary_password = var.admin_temp_password

  attributes = {
    email          = var.admin_email
    email_verified = true
  }

  lifecycle {
    ignore_changes = [temporary_password]
  }
}
