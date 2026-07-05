# Ücretsiz (AWS Budgets hesap başına ilk 2 budget'ı ücretsiz sunar, e-posta bildirimi de
# ücretsiz). Bu proje ücretsiz katmanda kalacak şekilde tasarlandı — bu alarm, beklenmedik bir
# şeyin (kaza, kötüye kullanım, yanlış yapılandırma) faturayı gerçekten şişirmeye başladığını
# erken fark etmek için bir güvenlik ağı.
resource "aws_budgets_budget" "monthly_cost" {
  name         = "${var.project_name}-monthly-cost"
  budget_type  = "COST"
  limit_amount = "5"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.admin_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.admin_email]
  }
}
