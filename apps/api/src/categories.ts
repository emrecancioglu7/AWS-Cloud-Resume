// Sabit kategori listesi — processor.ts (OpenAI'ye enum olarak verilir) ve statements.ts
// (manuel kategori değişikliğini doğrulamak için) tarafından paylaşılır. apps/web'deki
// categories.ts ile senkron tutulmalı (ayrı bir paket olmadığı için elle senkronize edilir).
export const CATEGORIES = [
  "Market",
  "Restoran/Kafe",
  "Ulaşım",
  "Faturalar/Abonelikler",
  "Giyim",
  "Sağlık",
  "Eğitim",
  "Eğlence",
  "Elektronik",
  "Ev/Yaşam",
  "Seyahat",
  "Diğer",
];
