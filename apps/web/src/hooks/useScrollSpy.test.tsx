import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScrollSpy } from "./useScrollSpy";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function entry(target: Element, ratio: number): IntersectionObserverEntry {
  return { target, intersectionRatio: ratio, isIntersecting: ratio > 0 } as IntersectionObserverEntry;
}

describe("useScrollSpy", () => {
  let originalIO: typeof window.IntersectionObserver;

  beforeEach(() => {
    originalIO = window.IntersectionObserver;
    FakeIntersectionObserver.instances = [];
    window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    document.body.innerHTML = '<div id="one"></div><div id="two"></div>';
  });

  afterEach(() => {
    window.IntersectionObserver = originalIO;
    document.body.innerHTML = "";
  });

  it("defaults to the first id before anything intersects", () => {
    const { result } = renderHook(() => useScrollSpy(["one", "two"]));
    expect(result.current).toBe("one");
  });

  it("switches to whichever observed section has the highest intersection ratio", () => {
    const { result } = renderHook(() => useScrollSpy(["one", "two"]));
    const observer = FakeIntersectionObserver.instances[0];
    const one = document.getElementById("one")!;
    const two = document.getElementById("two")!;

    act(() => {
      observer.callback([entry(one, 0.2), entry(two, 0.8)], observer as unknown as IntersectionObserver);
    });
    expect(result.current).toBe("two");

    act(() => {
      observer.callback([entry(one, 0.9), entry(two, 0.1)], observer as unknown as IntersectionObserver);
    });
    expect(result.current).toBe("one");
  });

  it("falls back to the requested id when no matching element exists on the page", () => {
    const { result } = renderHook(() => useScrollSpy(["missing"]));
    expect(result.current).toBe("missing");
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });
});
