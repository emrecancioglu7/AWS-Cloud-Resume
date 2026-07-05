import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export function handleHealth(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "ok" }),
  };
}
