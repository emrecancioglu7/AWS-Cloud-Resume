# Infra (Terraform)

Bu dizindeki Terraform kodu **hiçbir AWS kaynağı oluşturmadan** yazıldı — Claude'un çalıştığı ortamda gerçek AWS erişim bilgisi yok. `terraform apply` bu makinede **hiç çalıştırılmadı** (yalnızca `terraform validate` ile sözdizimi/konfigürasyon doğrulaması yapıldı, bu da hiçbir AWS kaynağına dokunmaz).

Şu an tanımlı olanlar:

- `cognito.tf` — Admin panel için tek kullanıcılı bir Cognito User Pool (self-signup kapalı, TOTP tabanlı MFA zorunlu, SMS MFA yok) + SPA'nın kullanacağı app client.
- `dynamodb.tf` — Portföy verileri (Fund/Transaction/PriceHistory) için tek tablo (single-table design), on-demand billing mode.
- `lambda_api.tf` — `apps/api`'deki Lambda handler'ını çalıştıran, HTTP API (API Gateway) üzerinden yayınlayan, `/portfolio` route'unu Cognito JWT authorizer ile koruyan backend altyapısı.

## Apply etmeden önce

1. Kendi makinenizde [Terraform](https://developer.hashicorp.com/terraform/install) ve [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) kurulu olmalı, dar kapsamlı bir IAM kullanıcısıyla `aws configure` ile giriş yapılmış olmalı.
2. State şu an local (bkz. `versions.tf`) — `terraform.tfstate` bu dizinde oluşacak. **Bu dosyayı asla silmeyin**, güvenli bir yere yedekleyin (zaten `.gitignore`'da, commit'lenmez).
3. `admin_email` ve `admin_temp_password` değişkenlerini **asla dosyaya yazmayın**. Ortam değişkeni olarak geçin:
   ```bash
   export TF_VAR_admin_email="you@example.com"
   export TF_VAR_admin_temp_password="$(openssl rand -base64 24)"
   ```
4. Lambda kodunu derleyin — `lambda_api.tf`'teki `archive_file`, `apps/api/dist` klasörünü zipler; bu klasör önceden derlenmiş olmalı:
   ```bash
   cd apps/api
   npm install
   npm run build
   cd ../../infra
   ```
5. Gözden geçirin ve uygulayın:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
6. Admin panel ilk girişte bu geçici şifreyi değiştirmenizi isteyecek (Faz 3'te admin panel UI'ı eklendiğinde) ve TOTP MFA kurulumunu tamamlamanız gerekecek.
7. `apply` çıktısındaki `api_base_url`'i not edin — frontend'in ileride bu API'ye istek atması için kullanılacak. `GET {api_base_url}/health` auth gerektirmeden `{"status":"ok"}` dönmeli; `GET {api_base_url}/portfolio` ise geçerli bir Cognito ID token'ı olmadan 401 dönmeli.

`apps/api`'de kod her değiştiğinde `npm run build`'ı tekrar çalıştırıp `terraform apply`'ı yeniden çalıştırmanız gerekir (`source_code_hash` değişikliği algılayıp Lambda'yı günceller).

## Remote state'e geçiş (ileride, opsiyonel)

Local state tek bilgisayardan çalıştığınız sürece yeterlidir. Birden fazla makineden apply edecekseniz veya `terraform.tfstate`'i kaybetme riskine karşı ekstra güvence isterseniz: bir S3 bucket + DynamoDB kilit tablosu oluşturup `versions.tf`'e bir `backend "s3" { ... }` bloğu ekleyin, sonra `terraform init -migrate-state` çalıştırın.

## Güvenlik notları

- Bu kaynaklar hiçbir GitHub Actions secret'ı veya CI/CD kimlik bilgisi gerektirmez — sadece sizin kendi AWS hesabınızdan elle/lokal olarak apply edilir.
- `AdministratorAccess` gibi geniş bir IAM politikasıyla apply etmeyin; sadece Cognito, DynamoDB, Lambda, API Gateway ve IAM (rol/politika oluşturma) üzerinde yetkisi olan dar kapsamlı bir IAM kullanıcısı/rolü kullanın.
- Lambda'nın çalıştığı IAM rolü (`aws_iam_role.api_lambda`) sadece kendi CloudWatch log grubuna yazabilir ve sadece bu tek DynamoDB tablosuna (ve GSI'larına) erişebilir — başka hiçbir AWS kaynağına yetkisi yok.
- `/portfolio` route'u Cognito JWT authorizer ile korunuyor; `cors_allowed_origins` değişkeni varsayılan olarak sadece `emrecancioglu.com` ve yerel geliştirme origin'ine izin veriyor.
- DynamoDB tablosu, Cognito User Pool ve Lambda/API Gateway ücretsiz katman sınırları içinde kalacak şekilde tasarlandı (bkz. ana konuşmadaki maliyet notları), ama yine de AWS Budgets ile bir maliyet alarmı kurmanız önerilir.
