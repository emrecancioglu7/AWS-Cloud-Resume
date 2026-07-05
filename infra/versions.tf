terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # İlk apply için kasıtlı olarak local state kullanılıyor (backend bloğu yok) —
  # terraform.tfstate bu dizinde, kendi bilgisayarınızda oluşacak (zaten .gitignore'da).
  # Bu dosyayı ASLA silmeyin/kaybetmeyin: Terraform'un hangi AWS kaynaklarını
  # yönettiğinin tek kaydı budur. Güvenli bir yere (parola yöneticisi, şifreli
  # yedek) kopyalamanızı öneririz. İleride S3 remote backend'e geçmek isterseniz
  # infra/README.md'deki "Remote state'e geçiş" bölümüne bakın.
}

provider "aws" {
  region = var.aws_region
}
