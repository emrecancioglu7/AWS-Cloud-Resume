import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { ddb } from "./dynamo";
import { s3 } from "./s3";
import type { DdbSendMock } from "./test-utils";

async function makePdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) doc.addPage([200, 200]);
  return Buffer.from(await doc.save());
}

let onePagePdf: Buffer;
let twoPagePdf: Buffer;

beforeAll(async () => {
  onePagePdf = await makePdf(1);
  twoPagePdf = await makePdf(2);
});

const { mockSsmSend } = vi.hoisted(() => ({ mockSsmSend: vi.fn() }));

vi.mock("./dynamo", () => ({ ddb: { send: vi.fn() }, TABLE_NAME: "test-table" }));
vi.mock("./s3", () => ({ s3: { send: vi.fn() }, STATEMENTS_BUCKET: "test-bucket" }));
vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: vi.fn(function () {
    return { send: mockSsmSend };
  }),
  GetParameterCommand: vi.fn(function (input: unknown) {
    return { input };
  }),
}));

const { processStatement, extractTransactions, validateExtractedTransactions } = await import("./processor");

const send = ddb.send as unknown as DdbSendMock;
const s3Send = s3.send as unknown as DdbSendMock;
const originalFetch = global.fetch;

beforeEach(() => {
  send.mockReset();
  s3Send.mockReset();
  mockSsmSend.mockReset();
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

function mockOpenAiResponse(
  transactions: unknown[],
  statementMonth = "2026-01",
  statementTransactionCount = transactions.length,
  statementPeriodAmount = 0,
) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ statementMonth, statementTransactionCount, statementPeriodAmount, transactions }) } }],
      }),
  });
}

describe("extractTransactions", () => {
  it("sends the PDF as a base64 file input and parses the structured JSON response", async () => {
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", categoryConfidence: 0.92, isRecurring: false }]);

    const result = await extractTransactions(onePagePdf, "sk-test");

    expect(result).toEqual({
      statementMonth: "2026-01",
      statementTransactionCount: 1,
      statementPeriodAmount: null,
      transactions: [{ date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", categoryConfidence: 0.92, isRecurring: false }],
    });
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(init.body);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.required).toContain("statementMonth");
    expect(body.response_format.json_schema.schema.required).toContain("statementTransactionCount");
    expect(body.response_format.json_schema.schema.required).toContain("statementPeriodAmount");
    expect(body.response_format.json_schema.schema.properties.transactions.items.required).toContain("categoryConfidence");
    expect(body.messages[0].content[0].text).toContain("dönem içi işlem sayısı");
    expect(body.messages[0].content[0].text).toContain("Dönem Içi İşlemler");
    expect(body.messages[0].content[1].file.file_data).toContain("data:application/pdf;base64,");
  });

  it("throws with the response body when OpenAI returns an error status", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve("invalid api key") });
    await expect(extractTransactions(onePagePdf, "sk-bad")).rejects.toThrow("invalid api key");
  });

  it("splits a multi-page PDF into one OpenAI call per page and merges the results", async () => {
    // Uzun/çok kart sahipli ekstrelerde tek çağrı satır kaçırıyordu — her sayfa artık izole işleniyor.
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    statementMonth: "2026-05",
                    statementTransactionCount: 0,
                    statementPeriodAmount: 0,
                    transactions: [{ date: "2026-05-05", merchant: "Migros", amount: 100, category: "Market", categoryConfidence: 0.9, isRecurring: false }],
                  }),
                },
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    statementMonth: "", // bu sayfada dönem ayı görünmüyor
                    statementTransactionCount: 0,
                    statementPeriodAmount: 954.12, // hesap özeti bu sayfada
                    transactions: [
                      { date: "2026-05-06", merchant: "Netflix", amount: 50, category: "Faturalar/Abonelikler", categoryConfidence: 0.95, isRecurring: true },
                    ],
                  }),
                },
              },
            ],
          }),
      });

    const result = await extractTransactions(twoPagePdf, "sk-test");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.transactions.map((t) => t.merchant)).toEqual(["Migros", "Netflix"]);
    expect(result.statementMonth).toBe("2026-05"); // sadece 1. sayfada belirtilmiş, boş olan 2. sayfa ezmiyor
    expect(result.statementPeriodAmount).toBe(954.12); // sadece 2. sayfada belirtilmiş
  });
});

describe("processStatement", () => {
  it("marks the statement processing, extracts transactions, writes them, and marks done", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", categoryConfidence: 0.88, isRecurring: false }]);
    send.mockResolvedValue({}); // status updates + the transaction write, in any order

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const claimCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":processing"] === "processing");
    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "done");
    expect(claimCall).toBeTruthy();
    expect(completedCall?.[0].input.ExpressionAttributeValues[":transactionCount"]).toBe(1);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":statementTransactionCount"]).toBe(1);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":missingTransactionCount"]).toBe(0);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":totalExtracted"]).toBe(250);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":statementMonth"]).toBe("2026-01");

    const putItem = send.mock.calls.flatMap((c) => c[0].input.RequestItems?.["test-table"] ?? []).find((request) => request.PutRequest)?.PutRequest.Item;
    expect(putItem).toMatchObject({
      pk: "STATEMENT#abc-123",
      gsi1pk: "CCTXN",
      merchant: "Migros",
      canonicalMerchant: "MIGROS",
      amount: 250,
      categoryConfidence: 0.88,
    });
    expect(putItem?.txnId).toMatch(/^[a-f0-9]{20}$/);
  });

  it("denormalizes the statement's bank and an explicit txnId onto each transaction", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", isRecurring: false }]);
    send.mockResolvedValueOnce({}); // claim processing
    send.mockResolvedValueOnce({}); // set stage reading
    send.mockResolvedValueOnce({ Item: { bank: "Akbank" } }); // statement metadata lookup
    send.mockResolvedValueOnce({}); // set stage extracting
    send.mockResolvedValueOnce({}); // set stage validating
    send.mockResolvedValueOnce({}); // category override lookup — none saved
    send.mockResolvedValueOnce({}); // set stage saving
    send.mockResolvedValueOnce({ Items: [] }); // existing transaction cleanup
    send.mockResolvedValueOnce({}); // the transaction BatchWriteCommand
    send.mockResolvedValueOnce({}); // set completed

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const putItem = send.mock.calls.flatMap((c) => c[0].input.RequestItems?.["test-table"] ?? []).find((request) => request.PutRequest)?.PutRequest.Item;
    expect(putItem).toMatchObject({ bank: "Akbank", merchant: "Migros", category: "Market" });
    expect(typeof putItem?.txnId).toBe("string");
  });

  it("applies a saved merchant category override instead of the AI-assigned category", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Netflix", amount: 50, category: "Diğer", categoryConfidence: 0.41, isRecurring: true }]);
    send.mockResolvedValueOnce({}); // claim processing
    send.mockResolvedValueOnce({}); // set stage reading
    send.mockResolvedValueOnce({}); // statement metadata lookup — no bank on file
    send.mockResolvedValueOnce({}); // set stage extracting
    send.mockResolvedValueOnce({}); // set stage validating
    send.mockResolvedValueOnce({ Item: { category: "Faturalar/Abonelikler" } }); // saved override for "Netflix"
    send.mockResolvedValueOnce({}); // set stage saving
    send.mockResolvedValueOnce({ Items: [] }); // existing transaction cleanup
    send.mockResolvedValueOnce({}); // the transaction BatchWriteCommand
    send.mockResolvedValueOnce({}); // set completed

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const putItem = send.mock.calls.flatMap((c) => c[0].input.RequestItems?.["test-table"] ?? []).find((request) => request.PutRequest)?.PutRequest.Item;
    expect(putItem?.category).toBe("Faturalar/Abonelikler");
    expect(putItem?.categoryConfidence).toBe(1);
    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "done");
    expect(completedCall?.[0].input.ExpressionAttributeValues[":lowConfidenceCount"]).toBe(0);
  });

  it("uses deterministic transaction IDs so retries overwrite the same rows", () => {
    const first = validateExtractedTransactions(
      [{ date: "2026-01-05", merchant: "IYZICO/HEPSIBURADA.C", amount: 1744.88, category: "Elektronik", categoryConfidence: 0.91, isRecurring: false }],
      "abc-123",
    );
    const second = validateExtractedTransactions(
      [{ date: "2026-01-05", merchant: "iyzico - hepsiburada.c", amount: 1744.88, category: "Diğer", categoryConfidence: 0.42, isRecurring: false }],
      "abc-123",
    );

    expect(first.transactions[0].canonicalMerchant).toBe("HEPSIBURADA C");
    expect(second.transactions[0].canonicalMerchant).toBe("HEPSIBURADA C");
    expect(second.transactions[0].txnId).toBe(first.transactions[0].txnId);
  });

  it("normalizes common Turkish statement date and amount formats instead of failing the whole statement", () => {
    const result = validateExtractedTransactions(
      [
        { date: "05.06.2026", merchant: "Migros", amount: "₺1.234,56", category: "Market", categoryConfidence: 0.91, isRecurring: false },
        { date: "bad-date", merchant: "Bozuk satır", amount: "x", category: "Market", categoryConfidence: 0.91, isRecurring: false },
      ],
      "abc-123",
      "2026-06",
    );

    expect(result.statementMonth).toBe("2026-06");
    expect(result.skippedInvalidCount).toBe(1);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({ date: "2026-06-05", amount: 1234.56 });
  });

  it("marks completed statements as needs_review when extracted transactions have low confidence", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Bilinmeyen", amount: 50, category: "Diğer", categoryConfidence: 0.41, isRecurring: false }]);
    send.mockResolvedValue({});

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "needs_review");
    expect(completedCall?.[0].input.ExpressionAttributeValues[":lowConfidenceCount"]).toBe(1);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":reviewIssueCount"]).toBe(1);
  });

  it("marks statements as needs_review when the PDF transaction count is higher than the saved transaction count", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse(
      [
        { date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", categoryConfidence: 0.91, isRecurring: false },
        { date: "2026-01-06", merchant: "Netflix", amount: 50, category: "Faturalar/Abonelikler", categoryConfidence: 0.91, isRecurring: true },
      ],
      "2026-01",
      3,
    );
    send.mockResolvedValue({});

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "needs_review");
    expect(completedCall?.[0].input.ExpressionAttributeValues[":transactionCount"]).toBe(2);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":statementTransactionCount"]).toBe(3);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":missingTransactionCount"]).toBe(1);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":reviewIssueCount"]).toBe(1);
  });

  it("flags an amount mismatch when the PDF's own period total is far above the extracted sum, even without an explicit transaction count", () => {
    // Bu ekstre formatı (çoğu Türk banka ekstresi gibi) işlem SAYISINI hiç yazmıyor, sadece dönem
    // içi TUTARI yazıyor — statementTransactionCount reconcile'ı bu yüzden hiç tetiklenmez, tutar
    // bazlı reconcile bu boşluğu kapatmalı.
    const result = validateExtractedTransactions(
      [{ date: "2026-05-05", merchant: "Migros", amount: 100, category: "Market", categoryConfidence: 0.9, isRecurring: false }],
      "abc-123",
      "2026-05",
      null,
      1000, // PDF'te yazan dönem içi işlem tutarı — çıkarılan 100'ün çok üzerinde
    );

    expect(result.statementPeriodAmount).toBe(1000);
    expect(result.amountMismatch).toBe(true);
    expect(result.reviewIssueCount).toBe(1);
  });

  it("does not flag an amount mismatch for a small, expected gap (e.g. interest/fees not counted in the PDF's period total)", () => {
    const result = validateExtractedTransactions(
      [{ date: "2026-05-05", merchant: "Migros", amount: 950, category: "Market", categoryConfidence: 0.9, isRecurring: false }],
      "abc-123",
      "2026-05",
      null,
      1000, // %5 fark — eşiğin (%20) altında
    );

    expect(result.amountMismatch).toBe(false);
    expect(result.reviewIssueCount).toBe(0);
  });

  it("marks statements as needs_review when the extracted total is far below the PDF's own period amount", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse(
      [{ date: "2026-05-05", merchant: "Migros", amount: 100, category: "Market", categoryConfidence: 0.9, isRecurring: false }],
      "2026-05",
      0, // PDF işlem sayısını yazmıyor
      1000, // ama dönem içi tutarı yazıyor, çıkarılanın çok üzerinde
    );
    send.mockResolvedValue({});

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "needs_review");
    expect(completedCall?.[0].input.ExpressionAttributeValues[":statementPeriodAmount"]).toBe(1000);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":amountMismatch"]).toBe(true);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":reviewIssueCount"]).toBe(1);
  });

  it("merges transactions extracted from every page of a multi-page statement before saving", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(twoPagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    statementMonth: "2026-05",
                    statementTransactionCount: 0,
                    statementPeriodAmount: 0,
                    transactions: [{ date: "2026-05-05", merchant: "Migros", amount: 100, category: "Market", categoryConfidence: 0.9, isRecurring: false }],
                  }),
                },
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    statementMonth: "",
                    statementTransactionCount: 0,
                    statementPeriodAmount: 150,
                    transactions: [
                      { date: "2026-05-06", merchant: "Netflix", amount: 50, category: "Faturalar/Abonelikler", categoryConfidence: 0.95, isRecurring: true },
                    ],
                  }),
                },
              },
            ],
          }),
      });
    send.mockResolvedValue({});

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const completedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "done");
    expect(completedCall?.[0].input.ExpressionAttributeValues[":transactionCount"]).toBe(2);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":totalExtracted"]).toBe(150);
    expect(completedCall?.[0].input.ExpressionAttributeValues[":statementPeriodAmount"]).toBe(150); // eşit, amountMismatch tetiklenmiyor

    const putItems = send.mock.calls
      .flatMap((c) => c[0].input.RequestItems?.["test-table"] ?? [])
      .filter((r) => r.PutRequest)
      .map((r) => r.PutRequest.Item);
    expect(putItems.map((i) => i.merchant).sort()).toEqual(["Migros", "Netflix"]);
  });

  it("cleans old transaction rows before saving the newly validated batch", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    mockOpenAiResponse([{ date: "2026-01-05", merchant: "Migros", amount: 250, category: "Market", categoryConfidence: 0.9, isRecurring: false }]);
    send.mockResolvedValueOnce({}); // claim processing
    send.mockResolvedValueOnce({}); // set stage reading
    send.mockResolvedValueOnce({ Item: { bank: "Akbank" } }); // statement metadata lookup
    send.mockResolvedValueOnce({}); // set stage extracting
    send.mockResolvedValueOnce({}); // set stage validating
    send.mockResolvedValueOnce({}); // category override lookup
    send.mockResolvedValueOnce({}); // set stage saving
    send.mockResolvedValueOnce({ Items: [{ pk: "STATEMENT#abc-123", sk: "TXN#2026-01-01#old" }] }); // cleanup query
    send.mockResolvedValueOnce({}); // delete batch
    send.mockResolvedValueOnce({}); // put batch
    send.mockResolvedValueOnce({}); // done

    await processStatement("test-bucket", "statements/abc-123.pdf");

    const batchRequests = send.mock.calls.flatMap((c) => c[0].input.RequestItems?.["test-table"] ?? []);
    expect(batchRequests[0]).toEqual({ DeleteRequest: { Key: { pk: "STATEMENT#abc-123", sk: "TXN#2026-01-01#old" } } });
    expect(batchRequests[1].PutRequest.Item).toMatchObject({ merchant: "Migros" });
  });

  it("skips duplicate S3 events while the statement is not claimable", async () => {
    const err = new Error("conditional");
    err.name = "ConditionalCheckFailedException";
    send.mockRejectedValueOnce(err);

    await processStatement("test-bucket", "statements/abc-123.pdf");

    expect(s3Send).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("marks the statement failed and rethrows when extraction fails", async () => {
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve("server error") });
    send.mockResolvedValue({});

    await expect(processStatement("test-bucket", "statements/abc-123.pdf")).rejects.toThrow("server error");

    const failedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "failed");
    expect(failedCall?.[0].input.ExpressionAttributeValues[":err"]).toBe("Ekstre işlenemedi: AI servisi yanıt vermedi. Biraz sonra tekrar deneyin.");
  });

  it("stores a short user-facing IAM error when DynamoDB permissions are missing", async () => {
    send.mockResolvedValueOnce({}); // claim processing
    send.mockResolvedValueOnce({}); // set stage reading
    s3Send.mockResolvedValueOnce({ Body: { transformToByteArray: () => Promise.resolve(onePagePdf) } });
    mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "sk-test" } });
    send.mockRejectedValueOnce(new Error("User arn:aws:sts::123 is not authorized to perform: dynamodb:GetItem"));
    send.mockResolvedValueOnce({ Items: [] }); // cleanup query
    send.mockResolvedValueOnce({}); // setStatus failed

    await expect(processStatement("test-bucket", "statements/abc-123.pdf")).rejects.toThrow("dynamodb:GetItem");

    const failedCall = send.mock.calls.find((c) => c[0].input.ExpressionAttributeValues?.[":status"] === "failed");
    expect(failedCall?.[0].input.ExpressionAttributeValues[":err"]).toBe("Ekstre işlenemedi: işlemci yetkisi eksik. Terraform apply sonrası tekrar deneyin.");
  });

  it("throws for an unexpected S3 key shape without touching DynamoDB", async () => {
    await expect(processStatement("test-bucket", "unexpected-key")).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});
