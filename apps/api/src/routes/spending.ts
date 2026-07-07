import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse } from "../http";

const round2 = (n: number) => Math.round(n * 100) / 100;

async function resolveLatestMonth(): Promise<string | undefined> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :cctxn",
      ExpressionAttributeValues: { ":cctxn": "CCTXN" },
      ScanIndexForward: false,
      Limit: 1,
    }),
  );
  const latest = result.Items?.[0]?.gsi1sk;
  return typeof latest === "string" ? latest.slice(0, 7) : undefined;
}

// ?month=YYYY-MM query param scopes the summary to one month; omitted, the most recent month
// that actually has transactions is resolved and used (there is no "all time" view anymore —
// see Statements.tsx, which always asks for a specific month).
export async function handleSpendingSummary(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const month = event.queryStringParameters?.month ?? (await resolveLatestMonth());

  const result = month
    ? await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :cctxn AND begins_with(gsi1sk, :month)",
          ExpressionAttributeValues: { ":cctxn": "CCTXN", ":month": month },
        }),
      )
    : undefined;

  const transactions = result?.Items ?? [];
  const byCategory: Record<string, number> = {};
  const byBank: Record<string, number> = {};
  const merchants: Record<string, { amount: number; count: number }> = {};
  const recurring: typeof transactions = [];
  let total = 0;
  let maxTransaction: { merchant: string; amount: number; date: string; category: string } | null = null;

  for (const txn of transactions) {
    const amount = typeof txn.amount === "number" ? txn.amount : 0;
    const category = typeof txn.category === "string" ? txn.category : "Diğer";
    const bank = typeof txn.bank === "string" ? txn.bank : "Bilinmiyor";
    const merchant = typeof txn.merchant === "string" ? txn.merchant : "Bilinmiyor";
    const date = typeof txn.date === "string" ? txn.date : "";

    byCategory[category] = (byCategory[category] ?? 0) + amount;
    byBank[bank] = (byBank[bank] ?? 0) + amount;
    merchants[merchant] = { amount: (merchants[merchant]?.amount ?? 0) + amount, count: (merchants[merchant]?.count ?? 0) + 1 };
    total += amount;
    if (txn.isRecurring) recurring.push(txn);
    if (!maxTransaction || amount > maxTransaction.amount) maxTransaction = { merchant, amount: round2(amount), date, category };
  }

  for (const category of Object.keys(byCategory)) byCategory[category] = round2(byCategory[category]);
  for (const bank of Object.keys(byBank)) byBank[bank] = round2(byBank[bank]);

  const topMerchants = Object.entries(merchants)
    .map(([merchant, { amount, count }]) => ({ merchant, amount: round2(amount), count }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return jsonResponse(200, {
    month: month ?? null,
    total: round2(total),
    byCategory,
    byBank,
    topMerchants,
    recurring,
    maxTransaction,
    transactionCount: transactions.length,
  });
}
