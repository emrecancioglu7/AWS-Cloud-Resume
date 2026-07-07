import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse, parseBody } from "../http";

// pk="BANK_LIMIT", sk="BANK#<bank>" — kart/hesap başına aylık kullanım limiti. budgets.ts'teki
// desenin aynısı; bank adı sabit bir taksonomiye bağlı değil (handleCreateStatement de aynı
// şekilde sadece boş olmamasını kontrol ediyor), o yüzden burada da yalnızca trim edilmiş,
// boş olmayan bir string olması yeterli.
const BANK_LIMIT_PK = "BANK_LIMIT";

export async function handleListBankLimits(): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": BANK_LIMIT_PK },
    }),
  );

  const limits: Record<string, number> = {};
  for (const item of result.Items ?? []) {
    if (typeof item.bank === "string" && typeof item.limit === "number") limits[item.bank] = item.limit;
  }
  return jsonResponse(200, { limits });
}

export async function handleSetBankLimit(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const body = parseBody(event);
  const bank = typeof body.bank === "string" ? body.bank.trim() : "";
  const limit = typeof body.limit === "number" ? body.limit : NaN;

  if (!bank) return jsonResponse(400, { message: "bank zorunlu" });
  if (Number.isNaN(limit) || limit < 0) return jsonResponse(400, { message: "Geçersiz limit" });

  const key = { pk: BANK_LIMIT_PK, sk: `BANK#${bank}` };

  if (limit === 0) {
    await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key }));
    return jsonResponse(200, { bank, limit: null });
  }

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: { ...key, bank, limit } }));
  return jsonResponse(200, { bank, limit });
}
