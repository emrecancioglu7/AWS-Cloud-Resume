import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "./dynamo";

// Kullanıcı bir işlemin kategorisini manuel olarak değiştirdiğinde burada saklanır, böylece
// aynı işyerinden gelen gelecekteki ekstrelerdeki işlemler otomatik olarak doğru kategoriyle
// yazılır (processor.ts işleme sırasında burayı kontrol eder).
const OVERRIDE_PK = "CATEGORY_OVERRIDE";
const TURKISH_CHAR_MAP: Record<string, string> = {
  Ç: "C",
  Ğ: "G",
  İ: "I",
  Ö: "O",
  Ş: "S",
  Ü: "U",
  ç: "C",
  ğ: "G",
  ı: "I",
  ö: "O",
  ş: "S",
  ü: "U",
};

export function normalizeMerchant(merchant: string): string {
  return merchant
    .trim()
    .replace(/[ÇĞİÖŞÜçğıöşü]/g, (char) => TURKISH_CHAR_MAP[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^(IYZICO|PAYTR|PARAM|PARAMPOS|SHOPIER|PAYCELL|PAPARA)\s*[/*:_-]+\s*/i, "")
    .replace(/WWW\.|\.COM(?:\.TR)?/g, " ")
    .replace(/\b(REF|PROVIZYON|ISLEM|ORDER|SIPARIS|FIS|POS)\s*[:#-]?\s*\d+\b/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\b(SANAL|POS|TR|TRY)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getCategoryOverride(merchant: string): Promise<string | undefined> {
  const normalizedMerchant = normalizeMerchant(merchant);
  if (!normalizedMerchant) return undefined;
  const result = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { pk: OVERRIDE_PK, sk: `MERCHANT#${normalizedMerchant}` } }),
  );
  return result.Item?.category;
}

export async function saveCategoryOverride(merchant: string, category: string): Promise<void> {
  const normalizedMerchant = normalizeMerchant(merchant);
  if (!normalizedMerchant) return;
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: OVERRIDE_PK,
        sk: `MERCHANT#${normalizedMerchant}`,
        merchant,
        normalizedMerchant,
        category,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
