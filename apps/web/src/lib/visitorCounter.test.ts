import { afterEach, describe, expect, it, vi } from "vitest";

describe("fetchVisitorCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("calls the counter only once per page load, since every call increments it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(42) });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchVisitorCount } = await import("./visitorCounter");

    expect(await fetchVisitorCount()).toBe(42);
    expect(await fetchVisitorCount()).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed request instead of caching the failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(7) });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchVisitorCount } = await import("./visitorCounter");

    await expect(fetchVisitorCount()).rejects.toThrow("500");
    expect(await fetchVisitorCount()).toBe(7);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
