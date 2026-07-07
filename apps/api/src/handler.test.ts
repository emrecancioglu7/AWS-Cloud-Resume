import { describe, expect, it, vi } from "vitest";
import { makeEvent } from "./test-utils";

vi.mock("./routes/health", () => ({ handleHealth: vi.fn(() => ({ statusCode: 200, body: "health" })) }));
vi.mock("./routes/portfolio", () => ({ handleListFunds: vi.fn(() => ({ statusCode: 200, body: "portfolio" })) }));
vi.mock("./routes/summary", () => ({ handlePortfolioSummary: vi.fn(() => ({ statusCode: 200, body: "summary" })) }));
vi.mock("./routes/funds", () => ({
  handleCreateFund: vi.fn(() => ({ statusCode: 200, body: "create-fund" })),
  handleUpdateFund: vi.fn(() => ({ statusCode: 200, body: "update-fund" })),
  handleDeleteFund: vi.fn(() => ({ statusCode: 200, body: "delete-fund" })),
  handleAddPrice: vi.fn(() => ({ statusCode: 200, body: "add-price" })),
  handleListPrices: vi.fn(() => ({ statusCode: 200, body: "list-prices" })),
  handleUpdatePrice: vi.fn(() => ({ statusCode: 200, body: "update-price" })),
  handleDeletePrice: vi.fn(() => ({ statusCode: 200, body: "delete-price" })),
}));
vi.mock("./routes/transactions", () => ({
  handleAddTransaction: vi.fn(() => ({ statusCode: 200, body: "add-txn" })),
  handleListTransactions: vi.fn(() => ({ statusCode: 200, body: "list-txn" })),
  handleDeleteTransaction: vi.fn(() => ({ statusCode: 200, body: "delete-txn" })),
}));
vi.mock("./routes/statements", () => ({
  handleCreateStatement: vi.fn(() => ({ statusCode: 200, body: "create-statement" })),
  handleListStatements: vi.fn(() => ({ statusCode: 200, body: "list-statements" })),
  handleGetStatement: vi.fn(() => ({ statusCode: 200, body: "get-statement" })),
  handleDeleteStatement: vi.fn(() => ({ statusCode: 200, body: "delete-statement" })),
  handleUpdateStatementMonth: vi.fn(() => ({ statusCode: 200, body: "update-statement-month" })),
  handleUpdateTransactionCategory: vi.fn(() => ({ statusCode: 200, body: "update-transaction-category" })),
}));
vi.mock("./routes/spending", () => ({
  handleSpendingSummary: vi.fn(() => ({ statusCode: 200, body: "spending-summary" })),
}));
vi.mock("./routes/budgets", () => ({
  handleListBudgets: vi.fn(() => ({ statusCode: 200, body: "list-budgets" })),
  handleSetBudget: vi.fn(() => ({ statusCode: 200, body: "set-budget" })),
}));
vi.mock("./routes/bankLimits", () => ({
  handleListBankLimits: vi.fn(() => ({ statusCode: 200, body: "list-bank-limits" })),
  handleSetBankLimit: vi.fn(() => ({ statusCode: 200, body: "set-bank-limit" })),
}));

const { handler } = await import("./handler");

describe("handler routing", () => {
  it.each([
    ["GET /health", "health"],
    ["GET /portfolio", "portfolio"],
    ["GET /portfolio/summary", "summary"],
    ["POST /funds", "create-fund"],
    ["PUT /funds/{fundCode}", "update-fund"],
    ["DELETE /funds/{fundCode}", "delete-fund"],
    ["POST /funds/{fundCode}/prices", "add-price"],
    ["GET /funds/{fundCode}/prices", "list-prices"],
    ["PUT /funds/{fundCode}/prices/{date}", "update-price"],
    ["DELETE /funds/{fundCode}/prices/{date}", "delete-price"],
    ["POST /funds/{fundCode}/transactions", "add-txn"],
    ["GET /funds/{fundCode}/transactions", "list-txn"],
    ["DELETE /funds/{fundCode}/transactions/{txnId}", "delete-txn"],
    ["POST /statements", "create-statement"],
    ["GET /statements", "list-statements"],
    ["GET /statements/{statementId}", "get-statement"],
    ["DELETE /statements/{statementId}", "delete-statement"],
    ["PUT /statements/{statementId}", "update-statement-month"],
    ["PUT /statements/{statementId}/transactions/{txnId}", "update-transaction-category"],
    ["GET /spending/summary", "spending-summary"],
    ["GET /budgets", "list-budgets"],
    ["PUT /budgets", "set-budget"],
    ["GET /bank-limits", "list-bank-limits"],
    ["PUT /bank-limits", "set-bank-limit"],
  ])("routes %s to the expected handler", async (routeKey, expectedBody) => {
    const result = await handler(makeEvent({ routeKey }), {} as never, () => {});
    expect((result as { body: string }).body).toBe(expectedBody);
  });

  it("returns 404 for an unknown route", async () => {
    const result = await handler(makeEvent({ routeKey: "GET /nope" }), {} as never, () => {});
    expect((result as { statusCode: number }).statusCode).toBe(404);
  });
});
