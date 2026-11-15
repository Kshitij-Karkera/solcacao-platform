// Runs before every test file (see vitest.config.ts setupFiles).

// Adds DOM matchers such as expect(el).toBeInTheDocument()
import "@testing-library/jest-dom/vitest";

// jsdom does not implement the layout observer used by Radix sliders.
globalThis.ResizeObserver = class {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// jsdom does not implement scrollTo or matchMedia, so provide harmless fakes
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => { },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
});

// Tests never reach a real server: by default every API call fails as if offline
// (pages then use the bundled catalog). Tests that need the API stub fetch themselves.
import { afterEach, beforeEach, vi } from "vitest";
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline in tests"))),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});