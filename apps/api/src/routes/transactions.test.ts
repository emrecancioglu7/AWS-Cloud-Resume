import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import { handleAddTransaction, handleDeleteTransaction, handleListTransactions } from "./transactions";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleAddTransaction", () => {
  it.each([
    { date: "01-01-2026", type: "BUY", units: 1, price: 1 },
    { date: "2026-01-01", type: "HOLD", units: 1, price: 1 },
    { date: "2026-01-01", type: "BUY", units: 0, price: 1 },
    { date: "2026-01-01", type: "BUY", units: 1, price: -1 },
  ])("rejects invalid input %o", async (body) => {
    const result = await handleAddTransaction(makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify(body) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("writes a TXN item with a generated txnId", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleAddTransaction(
      makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify({ date: "2026-01-01", type: "BUY", units: 10, price: 5 }) }),
    );

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body).toMatchObject({ fundCode: "AFA", date: "2026-01-01", type: "BUY", units: 10, price: 5 });
    expect(typeof body.txnId).toBe("string");
    expect(body.sk).toBe(`TXN#2026-01-01#${body.txnId}`);
  });
});

describe("handleListTransactions", () => {
  it("queries newest-first", async () => {
    send.mockResolvedValueOnce({ Items: [] });
    await handleListTransactions(makeEvent({ pathParameters: { fundCode: "afa" } }));
    expect(send.mock.calls[0][0].input.ScanIndexForward).toBe(false);
  });
});

describe("handleDeleteTransaction", () => {
  it("returns 404 when no transaction matches the txnId", async () => {
    send.mockResolvedValueOnce({ Items: [{ pk: "FUND#AFA", sk: "TXN#2026-01-01#other", txnId: "other" }] });
    const result = await handleDeleteTransaction(makeEvent({ pathParameters: { fundCode: "afa", txnId: "missing" } }));
    expect(result.statusCode).toBe(404);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("deletes the matching transaction by its exact pk/sk", async () => {
    send.mockResolvedValueOnce({ Items: [{ pk: "FUND#AFA", sk: "TXN#2026-01-01#abc", txnId: "abc" }] });
    send.mockResolvedValueOnce({});

    const result = await handleDeleteTransaction(makeEvent({ pathParameters: { fundCode: "afa", txnId: "abc" } }));

    expect(result.statusCode).toBe(204);
    expect(send.mock.calls[1][0].input.Key).toEqual({ pk: "FUND#AFA", sk: "TXN#2026-01-01#abc" });
  });
});
