import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BatchWriteCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { s3, STATEMENTS_BUCKET } from "../s3";
import { jsonResponse, parseBody } from "../http";
import { CATEGORIES } from "../categories";
import { normalizeMerchant, saveCategoryOverride } from "../categoryOverrides";

const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 60 * 60;

export async function handleCreateStatement(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const body = parseBody(event);
  const bank = typeof body.bank === "string" ? body.bank.trim() : "";
  if (!bank) return jsonResponse(400, { message: "bank zorunlu" });

  const statementId = randomUUID();
  const s3Key = `statements/${statementId}.pdf`;
  const uploadedAt = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `STATEMENT#${statementId}`,
        sk: "METADATA",
        gsi1pk: "STATEMENT",
        gsi1sk: `${uploadedAt}#${statementId}`,
        statementId,
        bank,
        s3Key,
        status: "pending",
        processingStage: "queued",
        uploadedAt,
      },
    }),
  );

  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: STATEMENTS_BUCKET, Key: s3Key, ContentType: "application/pdf" }), {
    expiresIn: 300,
  });

  return jsonResponse(201, { statementId, uploadUrl });
}

export async function handleListStatements(): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :statement",
      ExpressionAttributeValues: { ":statement": "STATEMENT" },
      ScanIndexForward: false,
    }),
  );
  const statements = (result.Items ?? []).sort((a, b) => {
    const aMonth = typeof a.statementMonth === "string" ? a.statementMonth : typeof a.inferredMonth === "string" ? a.inferredMonth : "";
    const bMonth = typeof b.statementMonth === "string" ? b.statementMonth : typeof b.inferredMonth === "string" ? b.inferredMonth : "";
    const aSort = aMonth ? `${aMonth}-99` : typeof a.uploadedAt === "string" ? a.uploadedAt : "";
    const bSort = bMonth ? `${bMonth}-99` : typeof b.uploadedAt === "string" ? b.uploadedAt : "";
    const byStatementDate = bSort.localeCompare(aSort);
    if (byStatementDate !== 0) return byStatementDate;
    return String(b.uploadedAt ?? "").localeCompare(String(a.uploadedAt ?? ""));
  });
  return jsonResponse(200, { statements });
}

export async function handleGetStatement(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const statementId = event.pathParameters?.statementId;
  if (!statementId) return jsonResponse(400, { message: "statementId zorunlu" });

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `STATEMENT#${statementId}` },
    }),
  );

  const items = result.Items ?? [];
  const metadata = items.find((item) => item.sk === "METADATA");
  if (!metadata) return jsonResponse(404, { message: "Ekstre bulunamadı" });

  const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: STATEMENTS_BUCKET, Key: metadata.s3Key }), {
    expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
  });

  const transactions = items.filter((item) => item.sk !== "METADATA");
  return jsonResponse(200, { statement: { ...metadata, downloadUrl }, transactions });
}

// AI'ın belirlediği ekstre dönemi (statementMonth) yanlış çıkabiliyor — özellikle taksitli/farklı
// tarihli işlemlerin karıştığı ekstrelerde. Bu, kategori/harcama toplamlarını BOZMAZ (özet, her
// işlemin kendi tarihine göre gruplanıyor, bkz. spending.ts) — sadece ekstre satırındaki "Ekstre
// {ay}" etiketini ve outOfPeriodCount reconcile sinyalini etkiler. Elle düzeltme şansı burada.
export async function handleUpdateStatementMonth(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const statementId = event.pathParameters?.statementId;
  if (!statementId) return jsonResponse(400, { message: "statementId zorunlu" });

  const body = parseBody(event);
  const statementMonth = typeof body.statementMonth === "string" ? body.statementMonth.trim() : "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(statementMonth)) return jsonResponse(400, { message: "Geçersiz dönem (YYYY-MM olmalı)" });

  const pk = `STATEMENT#${statementId}`;
  const existingTxns = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :txnPrefix)",
      ExpressionAttributeValues: { ":pk": pk, ":txnPrefix": "TXN#" },
      ProjectionExpression: "#date",
      ExpressionAttributeNames: { "#date": "date" },
    }),
  );
  const outOfPeriodCount = (existingTxns.Items ?? []).filter(
    (item) => typeof item.date === "string" && item.date.slice(0, 7) !== statementMonth,
  ).length;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: "METADATA" },
      UpdateExpression: "SET statementMonth = :statementMonth, outOfPeriodCount = :outOfPeriodCount",
      ExpressionAttributeValues: { ":statementMonth": statementMonth, ":outOfPeriodCount": outOfPeriodCount },
    }),
  );

  return jsonResponse(200, { statementMonth, outOfPeriodCount });
}

export async function handleDeleteStatement(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const statementId = event.pathParameters?.statementId;
  if (!statementId) return jsonResponse(400, { message: "statementId zorunlu" });

  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `STATEMENT#${statementId}` },
      ProjectionExpression: "pk, sk",
    }),
  );

  const items = existing.Items ?? [];
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: chunk.map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } })) },
      }),
    );
  }

  return jsonResponse(204, null);
}

async function listAllCreditCardTransactions() {
  const items: Record<string, any>[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;

  do {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :cctxn",
        ExpressionAttributeValues: { ":cctxn": "CCTXN" },
        ExclusiveStartKey,
      }),
    );
    items.push(...(result.Items ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

async function updateTransactionsForMerchant(selectedTransaction: Record<string, any>, category: string) {
  const merchant = typeof selectedTransaction.merchant === "string" ? selectedTransaction.merchant : "";
  const normalizedMerchant = normalizeMerchant(merchant);
  if (!normalizedMerchant) return { updatedTransactions: 0, affectedStatementIds: [] as string[] };

  const allTransactions = await listAllCreditCardTransactions();
  const matches = allTransactions.filter((item) => {
    const itemMerchant = typeof item.canonicalMerchant === "string" ? item.canonicalMerchant : typeof item.merchant === "string" ? normalizeMerchant(item.merchant) : "";
    return itemMerchant === normalizedMerchant && typeof item.pk === "string" && typeof item.sk === "string";
  });
  if (
    typeof selectedTransaction.pk === "string" &&
    typeof selectedTransaction.sk === "string" &&
    !matches.some((item) => item.pk === selectedTransaction.pk && item.sk === selectedTransaction.sk)
  ) {
    matches.push(selectedTransaction);
  }

  for (const match of matches) {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: match.pk, sk: match.sk },
        UpdateExpression: "SET category = :category, categoryConfidence = :confidence",
        ExpressionAttributeValues: { ":category": category, ":confidence": 1 },
      }),
    );
  }

  return {
    updatedTransactions: matches.length,
    affectedStatementIds: Array.from(new Set(matches.map((item) => item.statementId).filter((value): value is string => typeof value === "string"))),
  };
}

// İşlemin kategorisini manuel olarak değiştirir ve işyeri adını bir "hafıza" satırına yazar —
// processor.ts gelecekteki ekstrelerde aynı işyerini işlerken burayı kontrol edip otomatik
// olarak doğru kategoriyi uygular (bkz. categoryOverrides.ts).
export async function handleUpdateTransactionCategory(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const statementId = event.pathParameters?.statementId;
  const txnId = event.pathParameters?.txnId;
  if (!statementId || !txnId) return jsonResponse(400, { message: "statementId ve txnId zorunlu" });

  const body = parseBody(event);
  const category = typeof body.category === "string" ? body.category : "";
  if (!CATEGORIES.includes(category)) return jsonResponse(400, { message: "Geçersiz kategori" });

  // txnId'ye özel bir GSI yok — bu ekstrenin (kişisel ölçekte küçük) işlemlerini çekip
  // aralarından bulmak, funds.ts'teki işlem silme rotasıyla aynı desen.
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `STATEMENT#${statementId}` },
    }),
  );

  const match = (result.Items ?? []).find((item) => item.txnId === txnId);
  if (!match) return jsonResponse(404, { message: "İşlem bulunamadı" });

  const updateResult = typeof match.merchant === "string" ? await updateTransactionsForMerchant(match, category) : undefined;

  if (typeof match.merchant === "string") {
    await saveCategoryOverride(match.merchant, category);
  }

  return jsonResponse(200, {
    category,
    updatedTransactions: updateResult?.updatedTransactions ?? 1,
    affectedStatementIds: updateResult?.affectedStatementIds ?? [statementId],
  });
}
