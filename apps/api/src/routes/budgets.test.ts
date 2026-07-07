import { beforeEach, describe, expect, it, vi } from "vitest";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import { handleListBudgets, handleSetBudget } from "./budgets";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));

const send = ddb.send as unknown as DdbSendMock;

beforeEach(() => {
  send.mockReset();
});

describe("handleListBudgets", () => {
  it("returns a category-to-limit map from the BUDGET partition", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { pk: "BUDGET", sk: "CATEGORY#Market", category: "Market", limit: 5000 },
        { pk: "BUDGET", sk: "CATEGORY#Ulaşım", category: "Ulaşım", limit: 1000 },
      ],
    });

    const result = await handleListBudgets();

    expect(send.mock.calls[0][0].input).toMatchObject({ ExpressionAttributeValues: { ":pk": "BUDGET" } });
    expect(JSON.parse(result.body as string)).toEqual({ budgets: { Market: 5000, Ulaşım: 1000 } });
  });

  it("returns an empty map when no budgets are set", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleListBudgets();
    expect(JSON.parse(result.body as string)).toEqual({ budgets: {} });
  });
});

describe("handleSetBudget", () => {
  it("rejects a category outside the fixed taxonomy", async () => {
    const result = await handleSetBudget(makeEvent({ body: JSON.stringify({ category: "Kripto", limit: 100 }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a negative or non-numeric limit", async () => {
    const result = await handleSetBudget(makeEvent({ body: JSON.stringify({ category: "Market", limit: -5 }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("upserts a budget for a valid category and positive limit", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleSetBudget(makeEvent({ body: JSON.stringify({ category: "Market", limit: 5000 }) }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Item).toMatchObject({ pk: "BUDGET", sk: "CATEGORY#Market", category: "Market", limit: 5000 });
    expect(JSON.parse(result.body as string)).toEqual({ category: "Market", limit: 5000 });
  });

  it("deletes the budget when limit is 0 (clearing it)", async () => {
    send.mockResolvedValueOnce({});
    const result = await handleSetBudget(makeEvent({ body: JSON.stringify({ category: "Market", limit: 0 }) }));

    expect(result.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Key).toEqual({ pk: "BUDGET", sk: "CATEGORY#Market" });
    expect(JSON.parse(result.body as string)).toEqual({ category: "Market", limit: null });
  });
});
