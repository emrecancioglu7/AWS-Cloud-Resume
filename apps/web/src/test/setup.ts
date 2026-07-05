import "@testing-library/jest-dom/vitest";

// Node's experimental native localStorage can shadow jsdom's implementation with a
// non-functional stub (see "--localstorage-file" warning) — force a working one for tests.
{
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    },
    writable: true,
    configurable: true,
  });
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = function MockIntersectionObserver() {
    return {
      root: null,
      rootMargin: "",
      scrollMargin: "",
      thresholds: [],
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
      takeRecords: () => [],
    };
  } as unknown as typeof IntersectionObserver;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = function MockResizeObserver() {
    return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
  } as unknown as typeof ResizeObserver;
}
