import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";

// Fund metadata rows are written with gsi1pk = "FUND" (see infra/dynamodb.tf's access
// pattern table) — the TEFAS scraper (Faz 3) will populate these; this just wires the read path.
export async function handleListFunds(): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :fund",
      ExpressionAttributeValues: { ":fund": "FUND" },
    }),
  );

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ funds: result.Items ?? [] }),
  };
}
