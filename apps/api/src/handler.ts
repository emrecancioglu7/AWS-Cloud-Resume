import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { handleHealth } from "./routes/health";
import { handleListFunds } from "./routes/portfolio";
import { handlePortfolioSummary } from "./routes/summary";
import {
  handleAddPrice,
  handleCreateFund,
  handleDeleteFund,
  handleDeletePrice,
  handleListPrices,
  handleUpdateFund,
  handleUpdatePrice,
} from "./routes/funds";
import { handleAddTransaction, handleDeleteTransaction, handleListTransactions } from "./routes/transactions";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  switch (event.routeKey) {
    case "GET /health":
      return handleHealth();
    case "GET /portfolio":
      return handleListFunds();
    case "GET /portfolio/summary":
      return handlePortfolioSummary();
    case "POST /funds":
      return handleCreateFund(event);
    case "PUT /funds/{fundCode}":
      return handleUpdateFund(event);
    case "DELETE /funds/{fundCode}":
      return handleDeleteFund(event);
    case "POST /funds/{fundCode}/prices":
      return handleAddPrice(event);
    case "GET /funds/{fundCode}/prices":
      return handleListPrices(event);
    case "PUT /funds/{fundCode}/prices/{date}":
      return handleUpdatePrice(event);
    case "DELETE /funds/{fundCode}/prices/{date}":
      return handleDeletePrice(event);
    case "POST /funds/{fundCode}/transactions":
      return handleAddTransaction(event);
    case "GET /funds/{fundCode}/transactions":
      return handleListTransactions(event);
    case "DELETE /funds/{fundCode}/transactions/{txnId}":
      return handleDeleteTransaction(event);
    default:
      return { statusCode: 404, body: JSON.stringify({ message: "Not found" }) };
  }
};
