terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Kendi state bucket'ınız ve kilit tablonuzla doldurun.
  # `terraform init` çalıştırmadan önce infra/README.md dosyasını okuyun.
  backend "s3" {
    # bucket         = "emrecancioglu-terraform-state"
    # key            = "personal-website/terraform.tfstate"
    # region         = "eu-north-1"
    # dynamodb_table = "terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
