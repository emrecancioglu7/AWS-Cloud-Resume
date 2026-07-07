import { createHash } from "node:crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { BatchWriteCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PDFDocument } from "pdf-lib";
import { ddb, TABLE_NAME } from "./dynamo";
import { s3 } from "./s3";
import { getCategoryOverride, normalizeMerchant } from "./categoryOverrides";
import { CATEGORIES } from "./categories";

const ssm = new SSMClient({});
const PROCESSOR_VERSION = "2026-07-07.split-pages-v3";
const OPENAI_MODEL = "gpt-4o";
const REVIEW_CONFIDENCE_THRESHOLD = 0.7;
// Ekstrenin kendi yazdığı "dönem içi işlem tutarı" ile çıkarılan işlemlerin toplamı arasındaki
// fark bu payın üzerindeyse needs_review'a düşer. %20 gibi görece gevşek bir eşik seçildi çünkü
// bankalar bu tutara faiz/vergi gibi kalemleri dahil edip etmemekte tutarlı değil — asıl amaç,
// modelin sayfa/kart sahibi atlayarak işlemlerin büyük bir kısmını (örn. %70) kaçırdığı ciddi
// eksik çıkarımları yakalamak, küçük yapısal farkları false-positive olarak işaretlememek.
const AMOUNT_RECONCILE_RELATIVE_THRESHOLD = 0.2;

// SSM Parameter Store (plain String, not SecureString) — deliberately not a Lambda environment
// variable and not a KMS-encrypted SecureString. This account's default Lambda-managed KMS key
// fails to authorize env var decryption for this execution role (see infra/lambda_api.tf's note
// on aws_lambda_function.api), and SecureString parameters hit the same KMS decrypt path. A plain
// String parameter is still IAM-gated (only this Lambda's role can GetParameter it) without ever
// touching KMS.
const OPENAI_KEY_PARAMETER = "/emrecancioglu-personal-site/openai-api-key";

interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number | string;
  category: string;
  categoryConfidence: number;
  isRecurring: boolean;
}

interface ExtractedStatement {
  statementMonth: string | null;
  statementTransactionCount: number | null;
  statementPeriodAmount: number | null;
  transactions: ExtractedTransaction[];
}

interface ValidatedTransaction extends ExtractedTransaction {
  date: string;
  amount: number;
  categoryConfidence: number;
  canonicalMerchant: string;
  txnId: string;
}

interface ValidationResult {
  transactions: ValidatedTransaction[];
  statementMonth: string | null;
  inferredMonth: string | null;
  lowConfidenceCount: number;
  outOfPeriodCount: number;
  skippedInvalidCount: number;
  statementTransactionCount: number | null;
  missingTransactionCount: number;
  statementPeriodAmount: number | null;
  amountMismatch: boolean;
  reviewIssueCount: number;
  totalExtracted: number;
}

class StatementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatementValidationError";
  }
}

async function getOpenAiKey(): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: OPENAI_KEY_PARAMETER }));
  const value = result.Parameter?.Value;
  if (!value) throw new Error("OpenAI API key SSM parametresinde bulunamadı");
  return value;
}

async function fetchStatementPdf(bucket: string, key: string): Promise<Buffer> {
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error("S3'ten dosya okunamadı");
  return Buffer.from(bytes);
}

function normalizeConfidence(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.75;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizeMonth(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function normalizeStatementTransactionCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const count = Math.trunc(value);
  return count > 0 ? count : null;
}

function normalizeStatementPeriodAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const amount = round2(Math.abs(value));
  return amount > 0 ? amount : null;
}

function formatIsoDate(year: number, month: number, day: number): string | null {
  const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isValidIsoDate(candidate) ? candidate : null;
}

function normalizeTransactionDate(value: unknown, statementMonth: string | null): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (isValidIsoDate(raw)) return raw;

  let match = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (match) return formatIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (match) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    return formatIsoDate(year, Number(match[2]), Number(match[1]));
  }

  match = raw.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (match && statementMonth) {
    const [year] = statementMonth.split("-").map(Number);
    return formatIsoDate(year, Number(match[2]), Number(match[1]));
  }

  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return round2(Math.abs(value));
  if (typeof value !== "string") return null;

  let normalized = value.trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot ? normalized.replace(/\./g, "").replace(",", ".") : normalized.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = normalized.replace(",", ".");
  } else if (lastDot > -1 && normalized.slice(lastDot + 1).length === 3) {
    normalized = normalized.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? round2(Math.abs(parsed)) : null;
}

function deterministicTxnId(statementId: string, txn: Omit<ValidatedTransaction, "txnId">, occurrence: number): string {
  return createHash("sha256")
    .update([statementId, txn.date, txn.canonicalMerchant, txn.amount.toFixed(2), occurrence].join("|"))
    .digest("hex")
    .slice(0, 20);
}

export function validateExtractedTransactions(
  transactions: ExtractedTransaction[],
  statementId: string,
  extractedStatementMonth: string | null = null,
  extractedStatementTransactionCount: number | null = null,
  extractedStatementPeriodAmount: number | null = null,
): ValidationResult {
  if (!Array.isArray(transactions)) {
    throw new StatementValidationError("AI çıktısı işlem listesi içermiyor.");
  }

  const statementMonth = normalizeMonth(extractedStatementMonth);
  const monthCounts = new Map<string, number>();
  const occurrenceByBase = new Map<string, number>();
  const valid: ValidatedTransaction[] = [];
  let lowConfidenceCount = 0;
  let skippedInvalidCount = 0;

  transactions.forEach((txn) => {
    const merchant = typeof txn.merchant === "string" ? txn.merchant.trim() : "";
    const canonicalMerchant = normalizeMerchant(merchant);
    const amount = parseAmount(txn.amount);
    const confidence = normalizeConfidence(txn.categoryConfidence);
    const date = normalizeTransactionDate(txn.date, statementMonth);

    if (!date || !merchant || !canonicalMerchant || amount === null || amount <= 0) {
      skippedInvalidCount += 1;
      return;
    }

    const category = CATEGORIES.includes(txn.category) ? txn.category : "Diğer";
    const categoryConfidence = CATEGORIES.includes(txn.category) ? confidence : Math.min(confidence, 0.4);
    const isRecurring = typeof txn.isRecurring === "boolean" ? txn.isRecurring : false;

    if (categoryConfidence < REVIEW_CONFIDENCE_THRESHOLD) lowConfidenceCount += 1;
    const month = date.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);

    const base = [date, canonicalMerchant, amount.toFixed(2)].join("|");
    const occurrence = (occurrenceByBase.get(base) ?? 0) + 1;
    occurrenceByBase.set(base, occurrence);

    const validated = {
      ...txn,
      date,
      merchant,
      amount,
      category,
      categoryConfidence,
      isRecurring,
      canonicalMerchant,
      txnId: "",
    };
    validated.txnId = deterministicTxnId(statementId, validated, occurrence);
    valid.push(validated);
  });

  if (valid.length === 0) {
    throw new StatementValidationError("Ekstrede geçerli harcama işlemi bulunamadı.");
  }

  const inferredMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const effectiveStatementMonth = statementMonth ?? inferredMonth;
  const outOfPeriodCount = effectiveStatementMonth ? valid.filter((txn) => txn.date.slice(0, 7) !== effectiveStatementMonth).length : 0;
  const statementTransactionCount = normalizeStatementTransactionCount(extractedStatementTransactionCount);
  const missingTransactionCount = statementTransactionCount ? Math.max(0, statementTransactionCount - valid.length) : 0;
  const totalExtracted = round2(valid.reduce((sum, txn) => sum + txn.amount, 0));
  const statementPeriodAmount = normalizeStatementPeriodAmount(extractedStatementPeriodAmount);
  const amountMismatch = statementPeriodAmount !== null && Math.abs(totalExtracted - statementPeriodAmount) > statementPeriodAmount * AMOUNT_RECONCILE_RELATIVE_THRESHOLD;

  return {
    transactions: valid,
    statementMonth: effectiveStatementMonth,
    inferredMonth,
    lowConfidenceCount,
    outOfPeriodCount,
    skippedInvalidCount,
    statementTransactionCount,
    missingTransactionCount,
    statementPeriodAmount,
    amountMismatch,
    reviewIssueCount: lowConfidenceCount + skippedInvalidCount + missingTransactionCount + (amountMismatch ? 1 : 0),
    totalExtracted,
  };
}

// Uzun/çok sayfalı, çok kart sahipli ekstrelerde modelin tek çağrıda tüm PDF'i işlerken satır
// kaçırdığı gözlemlendi (bkz. AMOUNT_RECONCILE_RELATIVE_THRESHOLD yorumu) — her sayfa artık ayrı
// bir OpenAI çağrısında, izole olarak işleniyor, sonuçlar birleştiriliyor. Bu, modelin "dikkatinin
// dağılacağı" toplam içerik miktarını sayfa başına küçültüyor.
async function splitPdfIntoPages(pdfBuffer: Buffer): Promise<Buffer[]> {
  const source = await PDFDocument.load(pdfBuffer);
  const pageCount = source.getPageCount();
  const pages: Buffer[] = [];
  for (let i = 0; i < pageCount; i += 1) {
    const single = await PDFDocument.create();
    const [copiedPage] = await single.copyPages(source, [i]);
    single.addPage(copiedPage);
    pages.push(Buffer.from(await single.save()));
  }
  return pages;
}

function mergeExtractedStatements(pages: ExtractedStatement[]): ExtractedStatement {
  return {
    statementMonth: pages.map((p) => p.statementMonth).find((v): v is string => v !== null) ?? null,
    statementTransactionCount: pages.reduce<number | null>(
      (max, p) => (p.statementTransactionCount !== null && p.statementTransactionCount > (max ?? 0) ? p.statementTransactionCount : max),
      null,
    ),
    statementPeriodAmount: pages.reduce<number | null>(
      (max, p) => (p.statementPeriodAmount !== null && p.statementPeriodAmount > (max ?? 0) ? p.statementPeriodAmount : max),
      null,
    ),
    transactions: pages.flatMap((p) => p.transactions),
  };
}

// NOT: OpenAI'nin dosya girişi + Structured Outputs istek şekli zamanla değişebilir — bu kodu
// deploy etmeden önce güncel OpenAI API dokümantasyonuyla (chat completions / responses,
// "file" content type, response_format.json_schema) karşılaştırıp doğrulayın.
async function extractTransactionsFromPage(pagePdfBuffer: Buffer, apiKey: string): Promise<ExtractedStatement> {
  const base64 = pagePdfBuffer.toString("base64");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Bu, çok sayfalı bir kredi kartı ekstresinin TEK BİR sayfasıdır — diğer sayfaları görmüyorsun, sadece bu sayfayı işle. " +
                "Bu sayfada ekstrenin dönem ayı belirtiliyorsa statementMonth alanına YYYY-MM formatında yaz; belirtilmiyorsa bu sayfadaki işlemlerin çoğunlukta olduğu ayı kullan, hiç işlem yoksa boş bırak. " +
                "Bu sayfada dönem içi işlem sayısı açıkça yazıyorsa statementTransactionCount alanına yaz; yoksa 0 yaz. " +
                "Bu sayfada 'Dönem Içi İşlemler' veya benzeri bir özet başlığı altında yazan dönem içi harcama TUTARINI (TRY, sadece sayı) statementPeriodAmount alanına yaz; böyle bir tutar bu sayfada yoksa 0 yaz. " +
                "Bu sayfada birden fazla kart numarası/kart sahibi bölümü olabilir (örn. ek kartlar) — HEPSİNİ işle, sadece ilk bölümle sınırlı kalma. " +
                "Bu sayfadaki dönem içi harcama/borç oluşturan işlem satırlarını tek tek çıkar; aynı gün, aynı işyeri ve aynı tutar tekrar ediyorsa bunları ayrı işlemler olarak koru. " +
                "Alışveriş, taksit, abonelik, kart ücreti, faiz, vergi, nakit avans gibi borç oluşturan satırları atlama. Kart ödemesi, iade/iptal/alacak ve özet/toplam satırlarını işlem olarak yazma. " +
                "Her işlem için tarih (YYYY-MM-DD), " +
                "işyeri/açıklama, tutar (TRY, pozitif sayı) ve aşağıdaki kategorilerden tam olarak birini ata: " +
                CATEGORIES.join(", ") +
                ". Kategori kararından ne kadar emin olduğunu categoryConfidence alanında 0 ile 1 arasında belirt. " +
                "Abonelik/düzenli ödeme gibi görünen işlemleri isRecurring=true olarak işaretle, diğerlerini false. Bu sayfada hiç işlem satırı yoksa transactions'ı boş dizi bırak.",
            },
            { type: "file", file: { filename: "statement-page.pdf", file_data: `data:application/pdf;base64,${base64}` } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "credit_card_transactions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              statementMonth: { type: "string" },
              statementTransactionCount: { type: "number" },
              statementPeriodAmount: { type: "number" },
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    merchant: { type: "string" },
                    amount: { type: "number" },
                    category: { type: "string", enum: CATEGORIES },
                    categoryConfidence: { type: "number" },
                    isRecurring: { type: "boolean" },
                  },
                  required: ["date", "merchant", "amount", "category", "categoryConfidence", "isRecurring"],
                  additionalProperties: false,
                },
              },
            },
            required: ["statementMonth", "statementTransactionCount", "statementPeriodAmount", "transactions"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API hatası (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  const parsed = JSON.parse(data.choices[0].message.content) as {
    statementMonth?: string;
    statementTransactionCount?: number;
    statementPeriodAmount?: number;
    transactions: ExtractedTransaction[];
  };
  return {
    statementMonth: normalizeMonth(parsed.statementMonth),
    statementTransactionCount: normalizeStatementTransactionCount(parsed.statementTransactionCount),
    statementPeriodAmount: normalizeStatementPeriodAmount(parsed.statementPeriodAmount),
    transactions: parsed.transactions,
  };
}

export async function extractTransactions(pdfBuffer: Buffer, apiKey: string): Promise<ExtractedStatement> {
  const pages = await splitPdfIntoPages(pdfBuffer);
  const perPage = await Promise.all(pages.map((page) => extractTransactionsFromPage(page, apiKey)));
  return mergeExtractedStatements(perPage);
}

async function claimProcessing(pk: string): Promise<boolean> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: "METADATA" },
        UpdateExpression:
          "SET #status = :processing, processingStage = :stage, processingStartedAt = :now, processorVersion = :version, model = :model REMOVE errorMessage, failedAt",
        ConditionExpression: "#status IN (:pending, :failed)",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":processing": "processing",
          ":pending": "pending",
          ":failed": "failed",
          ":stage": "reading_pdf",
          ":now": new Date().toISOString(),
          ":version": PROCESSOR_VERSION,
          ":model": OPENAI_MODEL,
        },
      }),
    );
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

async function setProcessingStage(pk: string, stage: "reading_pdf" | "extracting" | "validating" | "saving") {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: "METADATA" },
      UpdateExpression: "SET processingStage = :stage",
      ExpressionAttributeValues: { ":stage": stage },
    }),
  );
}

async function setCompleted(pk: string, status: "done" | "needs_review", stats: ValidationResult) {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: "METADATA" },
      UpdateExpression:
        "SET #status = :status, processingStage = :stage, processedAt = :processedAt, transactionCount = :transactionCount, totalExtracted = :totalExtracted, statementMonth = :statementMonth, statementTransactionCount = :statementTransactionCount, missingTransactionCount = :missingTransactionCount, statementPeriodAmount = :statementPeriodAmount, amountMismatch = :amountMismatch, lowConfidenceCount = :lowConfidenceCount, outOfPeriodCount = :outOfPeriodCount, skippedInvalidCount = :skippedInvalidCount, reviewIssueCount = :reviewIssueCount, inferredMonth = :inferredMonth, processorVersion = :version, model = :model REMOVE errorMessage, failedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":stage": "done",
        ":processedAt": new Date().toISOString(),
        ":transactionCount": stats.transactions.length,
        ":totalExtracted": stats.totalExtracted,
        ":statementMonth": stats.statementMonth,
        ":statementTransactionCount": stats.statementTransactionCount,
        ":missingTransactionCount": stats.missingTransactionCount,
        ":statementPeriodAmount": stats.statementPeriodAmount,
        ":amountMismatch": stats.amountMismatch,
        ":lowConfidenceCount": stats.lowConfidenceCount,
        ":outOfPeriodCount": stats.outOfPeriodCount,
        ":skippedInvalidCount": stats.skippedInvalidCount,
        ":reviewIssueCount": stats.reviewIssueCount,
        ":inferredMonth": stats.inferredMonth,
        ":version": PROCESSOR_VERSION,
        ":model": OPENAI_MODEL,
      },
    }),
  );
}

async function setFailed(pk: string, errorMessage: string) {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: "METADATA" },
      UpdateExpression: "SET #status = :status, processingStage = :stage, errorMessage = :err, failedAt = :failedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "failed",
        ":stage": "failed",
        ":err": errorMessage,
        ":failedAt": new Date().toISOString(),
      },
    }),
  );
}

async function existingTransactionKeys(pk: string): Promise<Array<{ pk: string; sk: string }>> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :txnPrefix)",
      ExpressionAttributeValues: { ":pk": pk, ":txnPrefix": "TXN#" },
      ProjectionExpression: "pk, sk",
    }),
  );
  return (result.Items ?? []).map((item) => ({ pk: item.pk, sk: item.sk })).filter((item) => typeof item.pk === "string" && typeof item.sk === "string");
}

async function batchWrite(requests: Array<{ DeleteRequest?: { Key: { pk: string; sk: string } }; PutRequest?: { Item: Record<string, unknown> } }>) {
  for (let i = 0; i < requests.length; i += 25) {
    let requestItems = { [TABLE_NAME]: requests.slice(i, i + 25) };
    for (let attempt = 0; attempt < 3 && requestItems[TABLE_NAME]?.length; attempt += 1) {
      const result = await ddb.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = (result.UnprocessedItems as typeof requestItems | undefined) ?? { [TABLE_NAME]: [] };
    }
    if (requestItems[TABLE_NAME]?.length) {
      throw new Error("DynamoDB batch write tamamlanamadı.");
    }
  }
}

async function deleteExistingTransactions(pk: string) {
  const keys = await existingTransactionKeys(pk);
  await batchWrite(keys.map((Key) => ({ DeleteRequest: { Key } })));
}

async function replaceTransactions(pk: string, items: Record<string, unknown>[]) {
  await deleteExistingTransactions(pk);
  await batchWrite(items.map((Item) => ({ PutRequest: { Item } })));
}

function userFacingErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/AccessDenied|not authorized|dynamodb:GetItem/i.test(message)) {
    return "Ekstre işlenemedi: işlemci yetkisi eksik. Terraform apply sonrası tekrar deneyin.";
  }
  if (/OpenAI API hatası|api key|429|rate limit/i.test(message)) {
    return "Ekstre işlenemedi: AI servisi yanıt vermedi. Biraz sonra tekrar deneyin.";
  }
  if (/S3'ten dosya okunamadı|NoSuchKey|AccessDenied.*s3/i.test(message)) {
    return "Ekstre dosyası okunamadı. PDF'i yeniden yükleyin.";
  }
  if (err instanceof StatementValidationError || /AI çıktısı|işlem.*geçersiz|Ekstrede .*işlem bulunamadı/i.test(message)) {
    return "Ekstrede doğrulanabilir harcama işlemi bulunamadı. PDF'i yeniden yükleyin veya işlem satırlarını kontrol edin.";
  }
  return "Ekstre işlenemedi. Yeniden yüklemeyi deneyin; sorun sürerse logları kontrol edin.";
}

async function transactionItems(statementId: string, pk: string, bank: string | undefined, transactions: ValidatedTransaction[]) {
  return Promise.all(
    transactions.map(async (txn) => {
      const override = await getCategoryOverride(txn.merchant);
      const categoryConfidence = override ? 1 : txn.categoryConfidence;
      return {
        pk,
        sk: `TXN#${txn.date}#${txn.txnId}`,
        gsi1pk: "CCTXN",
        gsi1sk: `${txn.date}#${statementId}#${txn.txnId}`,
        statementId,
        txnId: txn.txnId,
        bank,
        date: txn.date,
        merchant: txn.merchant,
        canonicalMerchant: txn.canonicalMerchant,
        amount: txn.amount,
        category: override ?? txn.category,
        categoryConfidence,
        isRecurring: txn.isRecurring,
      };
    }),
  );
}

export async function processStatement(bucket: string, key: string): Promise<void> {
  // key = "statements/<statementId>.pdf" — see handleCreateStatement in routes/statements.ts.
  const statementId = key.split("/")[1]?.replace(".pdf", "");
  if (!statementId) throw new Error(`Beklenmeyen S3 anahtarı: ${key}`);
  const pk = `STATEMENT#${statementId}`;

  try {
    const shouldProcess = await claimProcessing(pk);
    if (!shouldProcess) return;

    await setProcessingStage(pk, "reading_pdf");
    const [pdfBuffer, apiKey, metadata] = await Promise.all([
      fetchStatementPdf(bucket, key),
      getOpenAiKey(),
      ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: "METADATA" } })),
    ]);
    const bank = typeof metadata.Item?.bank === "string" ? metadata.Item.bank : undefined;

    await setProcessingStage(pk, "extracting");
    const extracted = await extractTransactions(pdfBuffer, apiKey);

    await setProcessingStage(pk, "validating");
    const validation = validateExtractedTransactions(
      extracted.transactions,
      statementId,
      extracted.statementMonth,
      extracted.statementTransactionCount,
      extracted.statementPeriodAmount,
    );
    const items = await transactionItems(statementId, pk, bank, validation.transactions);
    const effectiveLowConfidenceCount = items.filter(
      (item) => typeof item.categoryConfidence === "number" && item.categoryConfidence < REVIEW_CONFIDENCE_THRESHOLD,
    ).length;
    const completionStats = {
      ...validation,
      lowConfidenceCount: effectiveLowConfidenceCount,
      reviewIssueCount:
        effectiveLowConfidenceCount + validation.skippedInvalidCount + validation.missingTransactionCount + (validation.amountMismatch ? 1 : 0),
    };

    await setProcessingStage(pk, "saving");
    await replaceTransactions(pk, items);

    await setCompleted(pk, completionStats.reviewIssueCount > 0 ? "needs_review" : "done", completionStats);
  } catch (err) {
    await deleteExistingTransactions(pk).catch(() => undefined);
    await setFailed(pk, userFacingErrorMessage(err));
    throw err; // Lambda invocation still shows as failed in CloudWatch metrics/alarms
  }
}
