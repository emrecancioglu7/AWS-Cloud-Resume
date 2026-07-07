import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ddb } from "../dynamo";
import { makeEvent, type DdbSendMock } from "../test-utils";
import {
  handleCreateStatement,
  handleDeleteStatement,
  handleGetStatement,
  handleListStatements,
  handleUpdateStatementMonth,
  handleUpdateTransactionCategory,
} from "./statements";

vi.mock("../dynamo", () => ({
  ddb: { send: vi.fn() },
  TABLE_NAME: "test-table",
}));
vi.mock("../s3", () => ({ s3: {}, STATEMENTS_BUCKET: "test-bucket" }));
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: vi.fn() }));

const send = ddb.send as unknown as DdbSendMock;
const signedUrl = vi.mocked(getSignedUrl);

beforeEach(() => {
  send.mockReset();
  signedUrl.mockReset();
});

describe("handleCreateStatement", () => {
  it("rejects a missing bank", async () => {
    const result = await handleCreateStatement(makeEvent({ body: JSON.stringify({ bank: "" }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("writes METADATA and returns a presigned upload URL", async () => {
    send.mockResolvedValueOnce({});
    signedUrl.mockResolvedValueOnce("https://s3.example.com/presigned");

    const result = await handleCreateStatement(makeEvent({ body: JSON.stringify({ bank: "Akbank" }) }));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.uploadUrl).toBe("https://s3.example.com/presigned");
    expect(typeof body.statementId).toBe("string");

    const [command] = send.mock.calls[0];
    expect(command.input.Item).toMatchObject({ sk: "METADATA", gsi1pk: "STATEMENT", bank: "Akbank", status: "pending", processingStage: "queued" });
  });
});

describe("handleListStatements", () => {
  it("queries the gsi1 index for STATEMENT rows, newest first", async () => {
    send.mockResolvedValueOnce({ Items: [{ statementId: "a" }] });
    const result = await handleListStatements();

    expect(send.mock.calls[0][0].input).toMatchObject({ ExpressionAttributeValues: { ":statement": "STATEMENT" }, ScanIndexForward: false });
    expect(JSON.parse(result.body as string)).toEqual({ statements: [{ statementId: "a" }] });
  });

  it("sorts processed statements by statement month, newest first", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { statementId: "uploaded-newer", uploadedAt: "2026-07-06T00:00:00.000Z", statementMonth: "2026-05" },
        { statementId: "statement-newer", uploadedAt: "2026-07-01T00:00:00.000Z", statementMonth: "2026-06" },
        { statementId: "pending", uploadedAt: "2026-07-07T00:00:00.000Z", status: "pending" },
      ],
    });

    const result = await handleListStatements();
    const body = JSON.parse(result.body as string);

    expect(body.statements.map((s: { statementId: string }) => s.statementId)).toEqual(["pending", "statement-newer", "uploaded-newer"]);
  });
});

describe("handleGetStatement", () => {
  it("returns 404 when the statement doesn't exist", async () => {
    send.mockResolvedValueOnce({ Items: [] });
    const result = await handleGetStatement(makeEvent({ pathParameters: { statementId: "missing" } }));
    expect(result.statusCode).toBe(404);
  });

  it("splits METADATA from transaction rows and includes a presigned download URL", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { pk: "STATEMENT#abc", sk: "METADATA", status: "done", s3Key: "statements/abc.pdf" },
        { pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1", amount: 50 },
      ],
    });
    signedUrl.mockResolvedValueOnce("https://s3.example.com/download");

    const result = await handleGetStatement(makeEvent({ pathParameters: { statementId: "abc" } }));
    const body = JSON.parse(result.body as string);

    expect(body.statement).toEqual({
      pk: "STATEMENT#abc",
      sk: "METADATA",
      status: "done",
      s3Key: "statements/abc.pdf",
      downloadUrl: "https://s3.example.com/download",
    });
    expect(body.transactions).toEqual([{ pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1", amount: 50 }]);
  });
});

describe("handleDeleteStatement", () => {
  it("cascade-deletes all rows under the statement's pk", async () => {
    send.mockResolvedValueOnce({
      Items: [
        { pk: "STATEMENT#abc", sk: "METADATA" },
        { pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1" },
      ],
    });
    send.mockResolvedValueOnce({});

    const result = await handleDeleteStatement(makeEvent({ pathParameters: { statementId: "abc" } }));

    expect(result.statusCode).toBe(204);
    expect(send.mock.calls[1][0].input.RequestItems["test-table"]).toHaveLength(2);
  });
});

describe("handleUpdateStatementMonth", () => {
  it("rejects a missing statementId", async () => {
    const result = await handleUpdateStatementMonth(makeEvent({ pathParameters: {}, body: JSON.stringify({ statementMonth: "2026-05" }) }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a malformed month", async () => {
    const result = await handleUpdateStatementMonth(
      makeEvent({ pathParameters: { statementId: "abc" }, body: JSON.stringify({ statementMonth: "May 2026" }) }),
    );
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("updates statementMonth and recomputes outOfPeriodCount against the statement's own transactions", async () => {
    send.mockResolvedValueOnce({
      Items: [{ date: "2026-05-05" }, { date: "2026-06-01" }, { date: "2026-05-20" }],
    }); // txn query
    send.mockResolvedValueOnce({}); // metadata update

    const result = await handleUpdateStatementMonth(
      makeEvent({ pathParameters: { statementId: "abc" }, body: JSON.stringify({ statementMonth: "2026-05" }) }),
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ statementMonth: "2026-05", outOfPeriodCount: 1 });
    const [updateCommand] = send.mock.calls[1];
    expect(updateCommand.input).toMatchObject({
      Key: { pk: "STATEMENT#abc", sk: "METADATA" },
      ExpressionAttributeValues: { ":statementMonth": "2026-05", ":outOfPeriodCount": 1 },
    });
  });
});

describe("handleUpdateTransactionCategory", () => {
  it("rejects a missing statementId or txnId", async () => {
    const result = await handleUpdateTransactionCategory(makeEvent({ pathParameters: {} }));
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a category outside the fixed taxonomy", async () => {
    const result = await handleUpdateTransactionCategory(
      makeEvent({ pathParameters: { statementId: "abc", txnId: "t1" }, body: JSON.stringify({ category: "Kripto" }) }),
    );
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 404 when the transaction isn't found under the statement", async () => {
    send.mockResolvedValueOnce({ Items: [{ pk: "STATEMENT#abc", sk: "METADATA" }] });
    const result = await handleUpdateTransactionCategory(
      makeEvent({ pathParameters: { statementId: "abc", txnId: "missing" }, body: JSON.stringify({ category: "Market" }) }),
    );
    expect(result.statusCode).toBe(404);
  });

  it("updates every existing transaction with the same merchant and saves a merchant override for future statements", async () => {
    send.mockResolvedValueOnce({
      Items: [{ pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1", txnId: "t1", merchant: "Migros", category: "Diğer" }],
    });
    send.mockResolvedValueOnce({
      Items: [
        { pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1", statementId: "abc", txnId: "t1", merchant: "Migros", category: "Diğer" },
        { pk: "STATEMENT#def", sk: "TXN#2026-02-01#t2", statementId: "def", txnId: "t2", merchant: "MIGROS SANAL POS", category: "Diğer" },
        { pk: "STATEMENT#xyz", sk: "TXN#2026-02-01#t3", statementId: "xyz", txnId: "t3", merchant: "Netflix", category: "Diğer" },
      ],
    });
    send.mockResolvedValueOnce({}); // first matching transaction UpdateCommand
    send.mockResolvedValueOnce({}); // second matching transaction UpdateCommand
    send.mockResolvedValueOnce({}); // saveCategoryOverride's PutCommand

    const result = await handleUpdateTransactionCategory(
      makeEvent({ pathParameters: { statementId: "abc", txnId: "t1" }, body: JSON.stringify({ category: "Market" }) }),
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toMatchObject({ category: "Market", updatedTransactions: 2, affectedStatementIds: ["abc", "def"] });
    const updateCalls = send.mock.calls.filter((call) => call[0].input.UpdateExpression === "SET category = :category, categoryConfidence = :confidence");
    expect(updateCalls.map((call) => call[0].input.Key)).toEqual([
      { pk: "STATEMENT#abc", sk: "TXN#2026-01-01#t1" },
      { pk: "STATEMENT#def", sk: "TXN#2026-02-01#t2" },
    ]);
    expect(updateCalls[0][0].input.ExpressionAttributeValues).toEqual({ ":category": "Market", ":confidence": 1 });
    const overrideCall = send.mock.calls.at(-1)?.[0];
    expect(overrideCall?.input.Item).toMatchObject({ pk: "CATEGORY_OVERRIDE", sk: "MERCHANT#MIGROS", merchant: "Migros", category: "Market" });
  });
});
