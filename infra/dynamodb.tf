# Tek tablo tasarımı: Fund / Transaction / PriceHistory ve (Faz 4) kredi kartı Statement/TXN
# kayıtlarının hepsi bu tabloda tutulur.
#
# Erişim örüntüleri:
#   Fund metadata          pk = FUND#<fundCode>       sk = METADATA
#   Fund transaction       pk = FUND#<fundCode>       sk = TXN#<isoDate>#<txnId>
#   Fund price history     pk = FUND#<fundCode>       sk = PRICE#<isoDate>
#   Tüm portföyde tarihe göre sıralı liste (GSI1)     gsi1pk = FUND|PRICE|TXN         gsi1sk = <isoDate>#<fundCode>
#   Kredi kartı ekstre metadata (Faz 4)               pk = STATEMENT#<statementId>    sk = METADATA
#   Kredi kartı işlemi (Faz 4)                        pk = STATEMENT#<statementId>    sk = TXN#<isoDate>#<txnId>
#   Ekstreleri tarihe göre sıralı liste (GSI1)        gsi1pk = STATEMENT              gsi1sk = <uploadedAt>#<statementId>
#   Tüm kart işlemlerini tarihe göre sıralı liste (GSI1) gsi1pk = CCTXN               gsi1sk = <isoDate>#<statementId>#<txnId>
resource "aws_dynamodb_table" "portfolio" {
  name         = "${var.project_name}-portfolio"
  billing_mode = "PAY_PER_REQUEST" # ücretsiz katmana uygun, sabit kapasite maliyeti yok

  hash_key  = "pk"
  range_key = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}
