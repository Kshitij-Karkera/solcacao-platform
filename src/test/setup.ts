// Runs before every test file (see vitest.config.ts setupFiles).

// Adds DOM matchers such as expect(el).toBeInTheDocument()
import "@testing-library/jest-dom/vitest";

// jsdom does not implement scrollTo or matchMedia, so provide harmless fakes
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
