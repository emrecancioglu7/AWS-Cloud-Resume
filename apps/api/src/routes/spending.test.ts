import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import { handleSpendingSummary } from "./spending";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleSpendingSummary", () => {
  it("filters by month when provided as a query param, without resolving the latest month", async () => {
    send.mockResolvedValueOnce({ Items: [] });
    await handleSpendingSummary(makeEvent({ queryStringParameters: { month: "2026-01" } }));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toMatchObject({
      KeyConditionExpression: "gsi1pk = :cctxn AND begins_with(gsi1sk, :month)",
      ExpressionAttributeValues: { ":cctxn": "CCTXN", ":month": "2026-01" },
    });
  });

  it("resolves the latest month with data when no month is given, then sums per category/bank/merchant", async () => {
    send.mockResolvedValueOnce({ Items: [{ gsi1sk: "2026-02-10#abc#t1" }] }); // Limit-1 latest-month lookup
    send.mockResolvedValueOnce({
      Items: [
        { amount: 100, category: "Market", bank: "Akbank", merchant: "Migros", isRecurring: false },
        { amount: 50, category: "Market", bank: "Akbank", merchant: "Migros", isRecurring: false },
        { amount: 29.9, category: "Faturalar/Abonelikler", bank: "Garanti BBVA", merchant: "Netflix", isRecurring: true },
      ],
    });

    const result = await handleSpendingSummary(makeEvent());
    const body = JSON.parse(result.body as string);

    expect(send.mock.calls[1][0].input.ExpressionAttributeValues).toEqual({ ":cctxn": "CCTXN", ":month": "2026-02" });
    expect(body.month).toBe("2026-02");
    expect(body.total).toBe(179.9);
    expect(body.byCategory).toEqual({ Market: 150, "Faturalar/Abonelikler": 29.9 });
    expect(body.byBank).toEqual({ Akbank: 150, "Garanti BBVA": 29.9 });
    expect(body.topMerchants).toEqual([
      { merchant: "Migros", amount: 150, count: 2 },
      { merchant: "Netflix", amount: 29.9, count: 1 },
    ]);
    expect(body.recurring).toHaveLength(1);
    expect(body.transactionCount).toBe(3);
    expect(body.maxTransaction).toEqual({ merchant: "Migros", amount: 100, date: "", category: "Market" });
  });

  it("returns an empty summary with month=null when there is no data at all", async () => {
    send.mockResolvedValueOnce({}); // Limit-1 latest-month lookup finds nothing
    const result = await handleSpendingSummary(makeEvent());

    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(result.body as string)).toEqual({
      month: null,
      total: 0,
      byCategory: {},
      byBank: {},
      topMerchants: [],
      recurring: [],
      maxTransaction: null,
      transactionCount: 0,
    });
  });

  it("defaults uncategorized/unbanked transactions to Diğer/Bilinmiyor", async () => {
    send.mockResolvedValueOnce({ Items: [{ amount: 10, merchant: "X", isRecurring: false }] });
    const result = await handleSpendingSummary(makeEvent({ queryStringParameters: { month: "2026-01" } }));
    const body = JSON.parse(result.body as string);

    expect(body.byCategory).toEqual({ Diğer: 10 });
    expect(body.byBank).toEqual({ Bilinmiyor: 10 });
  });
});
