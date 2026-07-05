# Tek tablo tasarımı: Fund / Transaction / PriceHistory kayıtlarının hepsi bu tabloda tutulur.
#
# Erişim örüntüleri:
#   Fund metadata      pk = FUND#<fundCode>        sk = METADATA
#   Transaction        pk = FUND#<fundCode>        sk = TXN#<isoDate>#<txnId>
#   Price history      pk = FUND#<fundCode>        sk = PRICE#<isoDate>
#   Tüm portföyde tarihe göre sıralı liste (GSI1)  gsi1pk = <entityType>  gsi1sk = <isoDate>#<fundCode>
#
# Faz 3'teki backend API bu tabloya yazacak; şu an sadece şema tanımlanıyor, veri yok.
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
