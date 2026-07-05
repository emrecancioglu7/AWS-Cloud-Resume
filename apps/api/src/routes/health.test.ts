import { describe, expect, it } from "vitest";
import { handleHealth } from "./health";

describe("handleHealth", () => {
  it("returns a 200 status payload with no auth", () => {
    const result = handleHealth();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ status: "ok" });
  });
});
