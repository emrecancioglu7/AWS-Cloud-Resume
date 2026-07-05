import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { handleHealth } from "./routes/health";
import { handleListFunds } from "./routes/portfolio";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  switch (event.routeKey) {
    case "GET /health":
      return handleHealth();
    case "GET /portfolio":
      return handleListFunds();
    default:
      return { statusCode: 404, body: JSON.stringify({ message: "Not found" }) };
  }
};
