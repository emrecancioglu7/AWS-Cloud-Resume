# Infra (Terraform)

Bu dizindeki Terraform kodu **hiçbir AWS kaynağı oluşturmadan** yazıldı — Claude'un çalıştığı ortamda gerçek AWS erişim bilgisi yok. `terraform apply` bu makinede **hiç çalıştırılmadı** (yalnızca `terraform validate` ile sözdizimi/konfigürasyon doğrulaması yapıldı, bu da hiçbir AWS kaynağına dokunmaz).

Şu an tanımlı olanlar:

- `cognito.tf` — Admin panel için tek kullanıcılı bir Cognito User Pool (self-signup kapalı, TOTP tabanlı MFA zorunlu, SMS MFA yok) + SPA'nın kullanacağı app client.
- `dynamodb.tf` — Portföy verileri (Fund/Transaction/PriceHistory) için tek tablo (single-table design), on-demand billing mode.
- `lambda_api.tf` — `apps/api`'deki Lambda handler'ını çalıştıran, HTTP API (API Gateway) üzerinden yayınlayan backend altyapısı (fon/fiyat/işlem CRUD route'ları + portföy özeti, hepsi `/health` hariç Cognito JWT authorizer ile korunur).
- `budget.tf` — aylık $5 eşiğinin %80'i (gerçekleşen) ve %100'ü (tahmini) aşıldığında `admin_email`'e uyarı gönderen ücretsiz bir AWS Budgets alarmı.

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

## `terraform-personal-site` IAM kullanıcısı

`terraform apply`/`plan` bu isimde, sadece bu proje kapsamındaki kaynaklara yetkisi olan dar bir IAM kullanıcısıyla çalıştırılır (CI/CD'nin kullandığı `githubActions` kullanıcısıyla **karıştırmayın** — o sadece S3 sync + CloudFront invalidation yapabilir, bu Terraform işleri için kullanılamaz).

Bu kullanıcının policy'si, Terraform config'ine yeni bir kaynak türü eklendikçe birkaç kez güncellendi (her güncelleme, `terraform apply` sırasında çıkan bir `AccessDenied` hatasına karşılık geldi — bkz. aşağıdaki notlar). Şu an geçerli, eksiksiz hali:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Cognito",
      "Effect": "Allow",
      "Action": "cognito-idp:*",
      "Resource": "*"
    },
    {
      "Sid": "DynamoDB",
      "Effect": "Allow",
      "Action": "dynamodb:*",
      "Resource": "arn:aws:dynamodb:eu-north-1:761018862186:table/emrecancioglu-personal-site-*"
    },
    {
      "Sid": "Lambda",
      "Effect": "Allow",
      "Action": "lambda:*",
      "Resource": "arn:aws:lambda:eu-north-1:761018862186:function:emrecancioglu-personal-site-*"
    },
    {
      "Sid": "ApiGateway",
      "Effect": "Allow",
      "Action": "apigateway:*",
      "Resource": "arn:aws:apigateway:eu-north-1::/apis*"
    },
    {
      "Sid": "LambdaLogGroup",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:PutRetentionPolicy",
        "logs:TagResource",
        "logs:ListTagsForResource",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "arn:aws:logs:eu-north-1:761018862186:log-group:/aws/lambda/emrecancioglu-personal-site-*"
    },
    {
      "Sid": "LambdaLogsDescribe",
      "Effect": "Allow",
      "Action": "logs:DescribeLogGroups",
      "Resource": "arn:aws:logs:eu-north-1:761018862186:log-group::log-stream:"
    },
    {
      "Sid": "IamForLambdaRole",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole",
        "iam:TagRole",
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::761018862186:role/emrecancioglu-personal-site-*"
    },
    {
      "Sid": "Budgets",
      "Effect": "Allow",
      "Action": ["budgets:ViewBudget", "budgets:ModifyBudget", "budgets:ListTagsForResource"],
      "Resource": "arn:aws:budgets::761018862186:budget/emrecancioglu-personal-site-*"
    }
  ]
}
```

Notlar:
- `logs:DescribeLogGroups` ayrı bir statement'ta çünkü CloudWatch Logs bu işlem için özel bir "hesap geneli" ARN formatı istiyor (`log-group::log-stream:`, boş grup adıyla) — normal log grubu ARN pattern'iyle eşleşmiyor.
- `iam:ListAttachedRolePolicies` gerekli çünkü Terraform, bir IAM rolü oluşturduktan sonra onun durumunu tam okumak için bunu çağırıyor.
- `logs:DescribeLogStreams`/`GetLogEvents`/`FilterLogEvents` asıl `terraform apply` için gerekli değil, ama `aws logs tail` ile Lambda loglarını hata ayıklarken kullanışlı — kalıcı olarak bırakıldı.
- `budgets:ListTagsForResource` gerekli çünkü Terraform, budget'ı oluşturduktan sonra tam durumunu okumak için bunu da çağırıyor (aynı `iam:ListAttachedRolePolicies` deseni).
- **KMS izinleri kasıtlı olarak yok.** Bir noktada Lambda'nın ortam değişkenlerini decrypt edememesi sorunuyla karşılaşıldı (bu hesaba özgü bir AWS tuhaflığı — bkz. `CLAUDE.md`'deki "Known gotchas"), KMS customer-managed key ile çözmek yerine Lambda'nın hiç ortam değişkeni kullanmaması tercih edildi. Bu yüzden KMS'e hiç ihtiyaç yok; tekrar env var eklemeyi denerseniz KMS izinlerini de tekrar eklemeniz gerekecek (ve muhtemelen aynı sorunla karşılaşacaksınız).
- Yeni bir Terraform kaynak türü eklerseniz (`terraform apply` bir `AccessDenied` hatasıyla dururken), önce bu politikaya ilgili aksiyonu eklemeyi deneyin, Terraform kodunun yanlış olduğunu düşünmeden önce.

## Güvenlik notları

- Bu kaynaklar hiçbir GitHub Actions secret'ı veya CI/CD kimlik bilgisi gerektirmez — sadece sizin kendi AWS hesabınızdan elle/lokal olarak apply edilir.
- `AdministratorAccess` gibi geniş bir IAM politikasıyla apply etmeyin; sadece Cognito, DynamoDB, Lambda, API Gateway ve IAM (rol/politika oluşturma) üzerinde yetkisi olan dar kapsamlı bir IAM kullanıcısı/rolü kullanın.
- Lambda'nın çalıştığı IAM rolü (`aws_iam_role.api_lambda`) sadece kendi CloudWatch log grubuna yazabilir ve sadece bu tek DynamoDB tablosuna (ve GSI'larına) erişebilir — başka hiçbir AWS kaynağına yetkisi yok.
- `/portfolio` route'u Cognito JWT authorizer ile korunuyor; `cors_allowed_origins` değişkeni varsayılan olarak sadece `emrecancioglu.com` ve yerel geliştirme origin'ine izin veriyor.
- DynamoDB tablosu, Cognito User Pool ve Lambda/API Gateway ücretsiz katman sınırları içinde kalacak şekilde tasarlandı. `budget.tf` ile aylık $5 eşiğinde bir AWS Budgets alarmı da kurulu — %80 gerçekleşende ve %100 tahmini aşımda `admin_email`'e e-posta gelir.
