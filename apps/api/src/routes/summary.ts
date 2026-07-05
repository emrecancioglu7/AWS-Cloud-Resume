import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ddb, TABLE_NAME } from "../dynamo";
import { jsonResponse } from "../http";

interface FundSummary {
  fundCode: string;
  name: string;
  netUnits: number;
  latestPrice: number | null;
  latestPriceDate: string | null;
  currentValue: number | null;
}

async function summarizeFund(fundCode: string, name: string): Promise<FundSummary> {
  const [transactions, latestPrice] = await Promise.all([
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: { ":pk": `FUND#${fundCode}`, ":prefix": "TXN#" },
      }),
    ),
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: { ":pk": `FUND#${fundCode}`, ":prefix": "PRICE#" },
        ScanIndexForward: false,
        Limit: 1,
      }),
    ),
  ]);

  const netUnits = (transactions.Items ?? []).reduce((total, txn) => {
    const units = typeof txn.units === "number" ? txn.units : 0;
    return txn.type === "BUY" ? total + units : total - units;
  }, 0);

  const priceItem = latestPrice.Items?.[0];
  const price = typeof priceItem?.price === "number" ? priceItem.price : null;

  return {
    fundCode,
    name,
    netUnits,
    latestPrice: price,
    latestPriceDate: typeof priceItem?.date === "string" ? priceItem.date : null,
    currentValue: price !== null ? Math.round(netUnits * price * 100) / 100 : null,
  };
}

export async function handlePortfolioSummary(): Promise<APIGatewayProxyStructuredResultV2> {
  const fundsResult = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :fund",
      ExpressionAttributeValues: { ":fund": "FUND" },
    }),
  );

  const funds = await Promise.all(
    (fundsResult.Items ?? []).map((item) => summarizeFund(String(item.fundCode), String(item.name))),
  );

  const totalValue = funds.reduce((total, fund) => total + (fund.currentValue ?? 0), 0);

  return jsonResponse(200, { funds, totalValue: Math.round(totalValue * 100) / 100 });
}
