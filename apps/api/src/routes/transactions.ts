import { randomUUID } from "node:crypto";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse, parseBody } from "../http";

export async function handleAddTransaction(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const body = parseBody(event);
  const date = typeof body.date === "string" ? body.date : "";
  const type = body.type === "BUY" || body.type === "SELL" ? body.type : "";
  const units = typeof body.units === "number" ? body.units : NaN;
  const price = typeof body.price === "number" ? body.price : NaN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !type || !Number.isFinite(units) || units <= 0 || !Number.isFinite(price) || price <= 0) {
    return jsonResponse(400, { message: "date (YYYY-MM-DD), type (BUY|SELL), pozitif units ve price zorunlu" });
  }

  const txnId = randomUUID();
  const item = { pk: `FUND#${fundCode}`, sk: `TXN#${date}#${txnId}`, gsi1pk: "TXN", gsi1sk: `${date}#${fundCode}`, fundCode, txnId, date, type, units, price };
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return jsonResponse(201, item);
}

export async function handleListTransactions(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": `FUND#${fundCode}`, ":prefix": "TXN#" },
      ScanIndexForward: false,
    }),
  );
  return jsonResponse(200, { transactions: result.Items ?? [] });
}

export async function handleDeleteTransaction(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  const txnId = event.pathParameters?.txnId;
  if (!fundCode || !txnId) return jsonResponse(400, { message: "fundCode ve txnId zorunlu" });

  // No secondary index on txnId — fetch this fund's transactions (a small, personal-scale set)
  // and find the matching one in memory rather than adding a GSI just for single-item lookup.
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": `FUND#${fundCode}`, ":prefix": "TXN#" },
    }),
  );
  const match = (result.Items ?? []).find((item) => item.txnId === txnId);
  if (!match) return jsonResponse(404, { message: "İşlem bulunamadı" });

  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: match.pk, sk: match.sk } }));
  return jsonResponse(204, null);
}
