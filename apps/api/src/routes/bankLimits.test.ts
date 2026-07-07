import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import { handleListBankLimits, handleSetBankLimit } from "./bankLimits";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleListBankLimits", () => {
  it("returns a bank-to-limit map from the BANK_LIMIT partition", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { pk: "BANK_LIMIT", sk: "BANK#Akbank", bank: "Akbank", limit: 20000 },
        { pk: "BANK_LIMIT", sk: "BANK#QNB", bank: "QNB", limit: 10000 },
      ],
    });

    const result = await handleListBankLimits();

    expect(send.mock.calls[0][0].input).toMatchObject({ ExpressionAttributeValues: { ":pk": "BANK_LIMIT" } });
    expect(JSON.parse(result.body as string)).toEqual({ limits: { Akbank: 20000, QNB: 10000 } });
  });

  it("returns an empty map when no limits are set", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleListBankLimits();
    expect(JSON.parse(result.body as string)).toEqual({ limits: {} });
  });
});

describe("handleSetBankLimit", () => {
  it("rejects a missing bank", async () => {
    const result = await handleSetBankLimit(makeEvent({ body: JSON.stringify({ bank: "", limit: 100 }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a negative or non-numeric limit", async () => {
    const result = await handleSetBankLimit(makeEvent({ body: JSON.stringify({ bank: "Akbank", limit: -5 }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("upserts a limit for a valid bank and positive limit", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleSetBankLimit(makeEvent({ body: JSON.stringify({ bank: "Akbank", limit: 20000 }) }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Item).toMatchObject({ pk: "BANK_LIMIT", sk: "BANK#Akbank", bank: "Akbank", limit: 20000 });
    expect(JSON.parse(result.body as string)).toEqual({ bank: "Akbank", limit: 20000 });
  });

  it("deletes the limit when limit is 0 (clearing it)", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleSetBankLimit(makeEvent({ body: JSON.stringify({ bank: "Akbank", limit: 0 }) }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Key).toEqual({ pk: "BANK_LIMIT", sk: "BANK#Akbank" });
    expect(JSON.parse(result.body as string)).toEqual({ bank: "Akbank", limit: null });
  });
});
