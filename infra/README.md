# Infra (Terraform)

Bu dizindeki Terraform kodu **hiçbir AWS kaynağı oluşturmadan** yazıldı — Claude'un çalıştığı ortamda AWS CLI/Terraform kurulu değildi ve gerçek AWS erişim bilgisi yoktu. `terraform apply` bu makinede **hiç çalıştırılmadı**.

Şu an tanımlı olanlar:

- `cognito.tf` — Admin panel için tek kullanıcılı bir Cognito User Pool (self-signup kapalı, TOTP tabanlı MFA zorunlu, SMS MFA yok) + SPA'nın kullanacağı app client.
- `dynamodb.tf` — Portföy verileri (Fund/Transaction/PriceHistory) için tek tablo (single-table design), on-demand billing mode.

## Apply etmeden önce

1. Kendi makinenizde [Terraform](https://developer.hashicorp.com/terraform/install) ve [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) kurulu olmalı, `aws configure` ile kendi kimlik bilgilerinizle giriş yapılmış olmalı.
2. `versions.tf` içindeki `backend "s3"` bloğunu kendi state bucket'ınız ve kilit tablonuzla doldurun (yoksa önce onları elle veya ayrı bir Terraform konfigürasyonuyla oluşturun).
3. `admin_email` ve `admin_temp_password` değişkenlerini **asla dosyaya yazmayın**. Ortam değişkeni olarak geçin:
   ```bash
   export TF_VAR_admin_email="you@example.com"
   export TF_VAR_admin_temp_password="$(openssl rand -base64 24)"
   ```
4. Gözden geçirin ve uygulayın:
   ```bash
   cd infra
   terraform init
   terraform plan
   terraform apply
   ```
5. Admin panel ilk girişte bu geçici şifreyi değiştirmenizi isteyecek (Faz 3'te admin panel UI'ı eklendiğinde) ve TOTP MFA kurulumunu tamamlamanız gerekecek.

## Güvenlik notları

- Bu kaynaklar hiçbir GitHub Actions secret'ı veya CI/CD kimlik bilgisi gerektirmez — sadece sizin kendi AWS hesabınızdan elle/lokal olarak apply edilir.
- `AdministratorAccess` gibi geniş bir IAM politikasıyla apply etmeyin; sadece Cognito ve DynamoDB üzerinde yetkisi olan dar kapsamlı bir IAM kullanıcısı/rolü kullanın.
- DynamoDB tablosu ve Cognito User Pool ücretsiz katman sınırları içinde kalacak şekilde tasarlandı (bkz. ana konuşmadaki maliyet notları), ama yine de AWS Budgets ile bir maliyet alarmı kurmanız önerilir.
