/**
 * Writes the site's English and Spanish dictionaries (src/lib/i18n.tsx) to
 * backend/locales/en.json and es.json, which the API serves at /api/i18n/:lang.
 *
 * Run from frontend/ after changing any text:  npm run locales:export
 *
 * Text that depends on a value is a function in i18n.tsx, e.g. (n) => `${n} in stock`.
 * JSON cannot hold functions, so those are written as templates such as "{n} in stock";
 * the website keeps using its own functions for them.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = fileURLToPath(new URL("../../backend/locales/", import.meta.url));

/** Turn a function's parameter names into "{name}" placeholders, e.g. (n, total) -> "{n}", "{total}". */
function toTemplate(fn) {
  const params = fn
    .toString()
    .replace(/=>[\s\S]*$/, "")
    .replace(/[()\s]/g, "")
    .split(",")
    .filter(Boolean)
    .map((p) => p.replace(/[:=].*$/, ""));
  return String(fn(...params.map((p) => `{${p}}`)));
}

function serialize(value) {
  if (typeof value === "function") return toTemplate(value);
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  return value;
}

// Load i18n.tsx through Vite so TypeScript and the "@/" import alias work.
const vite = await createServer({
  root,
  logLevel: "error",
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const { DICTS } = await vite.ssrLoadModule("/src/lib/i18n.tsx");
  await mkdir(outDir, { recursive: true });
  for (const [lang, dict] of Object.entries(DICTS)) {
    const file = `${outDir}${lang}.json`;
    await writeFile(file, `${JSON.stringify(serialize(dict), null, 2)}\n`, "utf8");
    console.log(`Wrote backend/locales/${lang}.json`);
  }
} finally {
  await vite.close();
}
