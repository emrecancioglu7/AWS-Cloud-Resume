import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import type { DdbSendMock } from "../test-utils";
import { handlePortfolioSummary } from "./summary";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

// summarizeFund fires its transaction/price queries concurrently (Promise.all) across all funds,
// so responses must be routed by command input rather than call order.
function mockDynamo(fixtures: { funds: Array<{ fundCode: string; name: string }>; transactions: Record<string, Array<{ type: string; units: number }>>; latestPrices: Record<string, { date: string; price: number } | null> }) {
  send.mockImplementation((command: { input: Record<string, unknown> }) => {
    const input = command.input;
    if (input.IndexName === "gsi1") {
      return Promise.resolve({ Items: fixtures.funds });
    }
    const values = input.ExpressionAttributeValues as Record<string, string>;
    const pk = values[":pk"];
    const fundCode = pk.replace("FUND#", "");
    if (values[":prefix"] === "TXN#") {
      return Promise.resolve({ Items: fixtures.transactions[fundCode] ?? [] });
    }
    if (values[":prefix"] === "PRICE#") {
      const price = fixtures.latestPrices[fundCode];
      return Promise.resolve({ Items: price ? [price] : [] });
    }
    return Promise.resolve({ Items: [] });
  });
}

describe("handlePortfolioSummary", () => {
  it("nets BUY minus SELL units and multiplies by the latest price", async () => {
    mockDynamo({
      funds: [{ fundCode: "AFA", name: "Fon A" }],
      transactions: { AFA: [{ type: "BUY", units: 100 }, { type: "SELL", units: 20 }] },
      latestPrices: { AFA: { date: "2026-01-05", price: 12.5 } },
    });

    const result = await handlePortfolioSummary();
    const body = JSON.parse(result.body as string);

    expect(body.funds).toEqual([
      { fundCode: "AFA", name: "Fon A", netUnits: 80, latestPrice: 12.5, latestPriceDate: "2026-01-05", currentValue: 1000 },
    ]);
    expect(body.totalValue).toBe(1000);
  });

  it("reports a null value for a fund with no price history yet", async () => {
    mockDynamo({
      funds: [{ fundCode: "BFB", name: "Fon B" }],
      transactions: { BFB: [{ type: "BUY", units: 5 }] },
      latestPrices: { BFB: null },
    });

    const result = await handlePortfolioSummary();
    const body = JSON.parse(result.body as string);

    expect(body.funds[0]).toMatchObject({ netUnits: 5, latestPrice: null, currentValue: null });
    expect(body.totalValue).toBe(0);
  });

  it("sums currentValue across multiple funds and rounds to 2 decimals", async () => {
    mockDynamo({
      funds: [
        { fundCode: "AFA", name: "Fon A" },
        { fundCode: "BFB", name: "Fon B" },
      ],
      transactions: {
        AFA: [{ type: "BUY", units: 3 }],
        BFB: [{ type: "BUY", units: 7 }],
      },
      latestPrices: {
        AFA: { date: "2026-01-01", price: 10.111 },
        BFB: { date: "2026-01-01", price: 2 },
      },
    });

    const result = await handlePortfolioSummary();
    const body = JSON.parse(result.body as string);

    // 3 * 10.111 = 30.333 -> rounds to 30.33; 7 * 2 = 14; total 44.33
    expect(body.funds.find((f: { fundCode: string }) => f.fundCode === "AFA").currentValue).toBe(30.33);
    expect(body.totalValue).toBe(44.33);
  });

  it("returns an empty summary when there are no funds", async () => {
    mockDynamo({ funds: [], transactions: {}, latestPrices: {} });
    const result = await handlePortfolioSummary();
    expect(JSON.parse(result.body as string)).toEqual({ funds: [], totalValue: 0 });
  });
});
