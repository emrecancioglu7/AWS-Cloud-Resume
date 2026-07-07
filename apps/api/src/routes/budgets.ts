import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse, parseBody } from "../http";
import { CATEGORIES } from "../categories";

// pk="BUDGET", sk="CATEGORY#<category>" — tek kullanıcılık kişisel bütçe tanımları, kategori
// başına aylık üst limit. Kategori adı "Faturalar/Abonelikler" gibi "/" içerebildiğinden bir
// path parametresi olarak kullanılamıyor (API Gateway path segmentiyle çakışır) — bu yüzden
// hem okuma hem yazma tek bir "/budgets" rotası ve request body üzerinden yapılıyor.
const BUDGET_PK = "BUDGET";

export async function handleListBudgets(): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": BUDGET_PK },
    }),
  );

  const budgets: Record<string, number> = {};
  for (const item of result.Items ?? []) {
    if (typeof item.category === "string" && typeof item.limit === "number") budgets[item.category] = item.limit;
  }
  return jsonResponse(200, { budgets });
}

export async function handleSetBudget(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const body = parseBody(event);
  const category = typeof body.category === "string" ? body.category : "";
  const limit = typeof body.limit === "number" ? body.limit : NaN;

  if (!CATEGORIES.includes(category)) return jsonResponse(400, { message: "Geçersiz kategori" });
  if (Number.isNaN(limit) || limit < 0) return jsonResponse(400, { message: "Geçersiz limit" });

  const key = { pk: BUDGET_PK, sk: `CATEGORY#${category}` };

  if (limit === 0) {
    await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key }));
    return jsonResponse(200, { category, limit: null });
  }

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: { ...key, category, limit } }));
  return jsonResponse(200, { category, limit });
}
