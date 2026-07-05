import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import { handleAddPrice, handleCreateFund, handleDeleteFund, handleDeletePrice, handleListPrices, handleUpdateFund, handleUpdatePrice } from "./funds";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleCreateFund", () => {
  it("rejects a missing fundCode or name", async () => {
    const result = await handleCreateFund(makeEvent({ body: JSON.stringify({ fundCode: "", name: "" }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("uppercases the fund code and writes a METADATA item", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleCreateFund(makeEvent({ body: JSON.stringify({ fundCode: "afa", name: "Ak Portföy Alternatif Enerji" }) }));

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string)).toEqual({ fundCode: "AFA", name: "Ak Portföy Alternatif Enerji" });
    const [command] = send.mock.calls[0];
    expect(command.input).toMatchObject({
      TableName: "test-table",
      Item: { pk: "FUND#AFA", sk: "METADATA", gsi1pk: "FUND", gsi1sk: "AFA", fundCode: "AFA", name: "Ak Portföy Alternatif Enerji" },
    });
  });
});

describe("handleUpdateFund", () => {
  it("rejects when fundCode path param or name body field is missing", async () => {
    const result = await handleUpdateFund(makeEvent({ pathParameters: {}, body: JSON.stringify({ name: "" }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("overwrites the METADATA item with the new name", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleUpdateFund(makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify({ name: "Yeni İsim" }) }));

    expect(result.statusCode).toBe(200);
    const [command] = send.mock.calls[0];
    expect(command.input.Item).toMatchObject({ pk: "FUND#AFA", sk: "METADATA", name: "Yeni İsim" });
  });
});

describe("handleDeleteFund", () => {
  it("queries everything under the fund's pk and batch-deletes it", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { pk: "FUND#AFA", sk: "METADATA" },
        { pk: "FUND#AFA", sk: "PRICE#2026-01-01" },
        { pk: "FUND#AFA", sk: "TXN#2026-01-01#abc" },
      ],
    });
    send.mockResolvedValueOnce({});

    const result = await handleDeleteFund(makeEvent({ pathParameters: { fundCode: "afa" } }));

    expect(result.statusCode).toBe(204);
    expect(send).toHaveBeenCalledTimes(2);
    const [batchCommand] = send.mock.calls[1];
    expect(batchCommand.input.RequestItems["test-table"]).toHaveLength(3);
  });

  it("chunks batch deletes into groups of 25", async () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ pk: "FUND#AFA", sk: `PRICE#2026-01-${String(i + 1).padStart(2, "0")}` }));
    send.mockResolvedValueOnce({ Items: items });
    send.mockResolvedValueOnce({});
    send.mockResolvedValueOnce({});

    await handleDeleteFund(makeEvent({ pathParameters: { fundCode: "afa" } }));

    expect(send).toHaveBeenCalledTimes(3); // 1 query + 2 batch chunks (25 + 5)
    expect(send.mock.calls[1][0].input.RequestItems["test-table"]).toHaveLength(25);
    expect(send.mock.calls[2][0].input.RequestItems["test-table"]).toHaveLength(5);
  });
});

describe("handleAddPrice", () => {
  it("rejects an invalid date format", async () => {
    const result = await handleAddPrice(makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify({ date: "01-01-2026", price: 10 }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a non-positive price", async () => {
    const result = await handleAddPrice(makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify({ date: "2026-01-01", price: 0 }) }));
    expect(result.statusCode).toBe(400);
  });

  it("writes a PRICE item on valid input", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleAddPrice(makeEvent({ pathParameters: { fundCode: "afa" }, body: JSON.stringify({ date: "2026-01-01", price: 12.5 }) }));

    expect(result.statusCode).toBe(201);
    const [command] = send.mock.calls[0];
    expect(command.input.Item).toMatchObject({ pk: "FUND#AFA", sk: "PRICE#2026-01-01", gsi1pk: "PRICE", price: 12.5 });
  });
});

describe("handleUpdatePrice", () => {
  it("rejects a non-positive price", async () => {
    const result = await handleUpdatePrice(makeEvent({ pathParameters: { fundCode: "afa", date: "2026-01-01" }, body: JSON.stringify({ price: -1 }) }));
    expect(result.statusCode).toBe(400);
  });

  it("overwrites the PRICE item for that date", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleUpdatePrice(makeEvent({ pathParameters: { fundCode: "afa", date: "2026-01-01" }, body: JSON.stringify({ price: 15 }) }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Item).toMatchObject({ pk: "FUND#AFA", sk: "PRICE#2026-01-01", price: 15 });
  });
});

describe("handleDeletePrice", () => {
  it("deletes the exact price item by pk/sk", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleDeletePrice(makeEvent({ pathParameters: { fundCode: "afa", date: "2026-01-01" } }));

    expect(result.statusCode).toBe(204);
    expect(send.mock.calls[0][0].input.Key).toEqual({ pk: "FUND#AFA", sk: "PRICE#2026-01-01" });
  });
});

describe("handleListPrices", () => {
  it("queries prices newest-first", async () => {
    send.mockResolvedValueOnce({ Items: [{ date: "2026-01-02", price: 11 }] });
    const result = await handleListPrices(makeEvent({ pathParameters: { fundCode: "afa" } }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.ScanIndexForward).toBe(false);
    expect(JSON.parse(result.body as string)).toEqual({ prices: [{ date: "2026-01-02", price: 11 }] });
  });
});
