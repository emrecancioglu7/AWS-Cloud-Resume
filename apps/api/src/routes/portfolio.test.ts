import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import type { DdbSendMock } from "../test-utils";
import { handleListFunds } from "./portfolio";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleListFunds", () => {
  it("queries the gsi1 index for FUND rows", async () => {
    send.mockResolvedValueOnce({ Items: [{ fundCode: "AFA", name: "Fon A" }] });
    const result = await handleListFunds();

    expect(send.mock.calls[0][0].input).toMatchObject({ IndexName: "gsi1", ExpressionAttributeValues: { ":fund": "FUND" } });
    expect(JSON.parse(result.body as string)).toEqual({ funds: [{ fundCode: "AFA", name: "Fon A" }] });
  });

  it("returns an empty list rather than throwing when there are no items", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleListFunds();
    expect(JSON.parse(result.body as string)).toEqual({ funds: [] });
  });
});
