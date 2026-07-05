import { BatchWriteCommand, DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse, parseBody } from "../http";

export async function handleCreateFund(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const body = parseBody(event);
  const fundCode = typeof body.fundCode === "string" ? body.fundCode.trim().toUpperCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!fundCode || !name) return jsonResponse(400, { message: "fundCode ve name zorunlu" });

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { pk: `FUND#${fundCode}`, sk: "METADATA", gsi1pk: "FUND", gsi1sk: fundCode, fundCode, name },
    }),
  );
  return jsonResponse(201, { fundCode, name });
}

export async function handleUpdateFund(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const body = parseBody(event);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonResponse(400, { message: "name zorunlu" });

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { pk: `FUND#${fundCode}`, sk: "METADATA", gsi1pk: "FUND", gsi1sk: fundCode, fundCode, name },
    }),
  );
  return jsonResponse(200, { fundCode, name });
}

// Cascade delete: removes the fund's metadata plus every price/transaction row under it, so
// nothing orphaned lingers in the table (DynamoDB has no foreign keys/cascades of its own).
export async function handleDeleteFund(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `FUND#${fundCode}` },
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

export async function handleAddPrice(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const body = parseBody(event);
  const date = typeof body.date === "string" ? body.date : "";
  const price = typeof body.price === "number" ? body.price : NaN;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(price) || price <= 0) {
    return jsonResponse(400, { message: "date (YYYY-MM-DD) ve pozitif bir price zorunlu" });
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { pk: `FUND#${fundCode}`, sk: `PRICE#${date}`, gsi1pk: "PRICE", gsi1sk: `${date}#${fundCode}`, fundCode, date, price },
    }),
  );
  return jsonResponse(201, { fundCode, date, price });
}

export async function handleUpdatePrice(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  const date = event.pathParameters?.date;
  if (!fundCode || !date) return jsonResponse(400, { message: "fundCode ve date zorunlu" });

  const body = parseBody(event);
  const price = typeof body.price === "number" ? body.price : NaN;
  if (!Number.isFinite(price) || price <= 0) return jsonResponse(400, { message: "pozitif bir price zorunlu" });

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { pk: `FUND#${fundCode}`, sk: `PRICE#${date}`, gsi1pk: "PRICE", gsi1sk: `${date}#${fundCode}`, fundCode, date, price },
    }),
  );
  return jsonResponse(200, { fundCode, date, price });
}

export async function handleDeletePrice(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  const date = event.pathParameters?.date;
  if (!fundCode || !date) return jsonResponse(400, { message: "fundCode ve date zorunlu" });

  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk: `FUND#${fundCode}`, sk: `PRICE#${date}` } }));
  return jsonResponse(204, null);
}

export async function handleListPrices(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const fundCode = event.pathParameters?.fundCode?.toUpperCase();
  if (!fundCode) return jsonResponse(400, { message: "fundCode zorunlu" });

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": `FUND#${fundCode}`, ":prefix": "PRICE#" },
      ScanIndexForward: false,
    }),
  );
  return jsonResponse(200, { prices: result.Items ?? [] });
}
