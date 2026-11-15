// Student 2: site text served by the API (GET /api/i18n/:lang) with the bundled
// dictionaries as fallback, and a check that backend/locales matches them.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DICTS, I18nProvider, mergeDict, useI18n } from "@/lib/i18n";
import { mockApi } from "./mock-api";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function Probe() {
  const { t, setLang } = useI18n();
  return (
    <>
      <span data-testid="shop">{t.nav.shop}</span>
      <span data-testid="stock">{t.product.inStock(3)}</span>
      <button onClick={() => setLang("es")}>ES</button>
    </>
  );
}

describe("Student 2: translations from the API", () => {
  it("uses the API's text after switching language and keeps value-based text working", async () => {
    const { calls, setI18n } = mockApi();
    setI18n("es", {
      nav: { shop: "Tienda (desde la API)" },
      product: { inStock: "{n} disponibles" },
    });
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText("ES"));
    await waitFor(() =>
      expect(screen.getByTestId("shop")).toHaveTextContent("Tienda (desde la API)"),
    );
    // Functions stay local: the API's "{n}" template is not used for them.
    expect(screen.getByTestId("stock")).toHaveTextContent("3 disponibles");
    expect(calls.some((c) => c.path === "/api/i18n/es")).toBe(true);
  });

  it("keeps the bundled text when the API cannot be reached", async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId("shop")).toHaveTextContent(DICTS.en.nav.shop);
  });

  it("merges only plain text and ignores missing or mistyped values", () => {
    const base = { a: "one", b: ["x", "y"], f: (n: number) => `${n}`, n: { c: "deep" } };
    const merged = mergeDict(base, { a: "uno", b: ["x2"], f: "{n}", n: { c: 5 } });
    expect(merged.a).toBe("uno");
    expect(merged.b).toEqual(["x", "y"]); // wrong length: keep bundled
    expect(merged.f(2)).toBe("2"); // functions are never replaced
    expect(merged.n.c).toBe("deep"); // wrong type: keep bundled
  });
});

describe("backend/locales matches the site's dictionaries", () => {
  /** Every plain-text value in the bundled dictionary must appear unchanged in the JSON. */
  function compare(dict: unknown, json: unknown, path: string, problems: string[]) {
    if (typeof dict === "function") {
      if (typeof json !== "string") problems.push(`${path}: missing template`);
    } else if (typeof dict === "string") {
      if (json !== dict) problems.push(`${path}: "${String(json)}" should be "${dict}"`);
    } else if (Array.isArray(dict)) {
      if (!Array.isArray(json) || json.length !== dict.length)
        problems.push(`${path}: list differs`);
      else dict.forEach((d, i) => compare(d, json[i], `${path}[${i}]`, problems));
    } else if (dict && typeof dict === "object") {
      const j = (json ?? {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(dict))
        compare(v, j[k], path ? `${path}.${k}` : k, problems);
      for (const k of Object.keys(j))
        if (!(k in dict)) problems.push(`${path}.${k}: not in the site`);
    }
  }

  for (const lang of ["en", "es"] as const) {
    it(`${lang}.json is up to date (if this fails, run: npm run locales:export)`, () => {
      // Tests run from frontend/, so the API's locale files are in ../backend/locales.
      const file = resolve(process.cwd(), `../backend/locales/${lang}.json`);
      const json: unknown = JSON.parse(readFileSync(file, "utf8"));
      const problems: string[] = [];
      compare(DICTS[lang], json, "", problems);
      expect(problems).toEqual([]);
    });
  }
});
