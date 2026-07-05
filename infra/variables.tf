variable "aws_region" {
  description = "Kaynakların oluşturulacağı AWS bölgesi"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Kaynak adlarında önek olarak kullanılacak proje adı"
  type        = string
  default     = "emrecancioglu-personal-site"
}

variable "admin_email" {
  description = "Admin panel için Cognito kullanıcısının e-posta adresi (giriş kullanıcı adı olarak kullanılır)"
  type        = string
}

# Gerçek değeri asla dosyaya yazmayın — TF_VAR_admin_temp_password ortam değişkeniyle geçin.
variable "admin_temp_password" {
  description = "Admin kullanıcısı için tek seferlik geçici şifre (ilk girişte değiştirilir). Asla commit etmeyin."
  type        = string
  sensitive   = true
}

variable "cors_allowed_origins" {
  description = "Backend API'ye (API Gateway) tarayıcıdan istek atmasına izin verilen origin'ler"
  type        = list(string)
  default     = ["https://emrecancioglu.com", "http://localhost:5173"]
}
