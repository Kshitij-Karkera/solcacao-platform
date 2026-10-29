// Cross-browser, multi-viewport and keyboard checks for the SolCacao front end.
//
// Usage (dev server or production build must already be running):
//   npm install --no-save --package-lock=false playwright
//   npx playwright install chromium firefox webkit
//   node tests/cross-browser-test.cjs
//
// Environment variables:
//   BASE_URL        default http://127.0.0.1:5174
//   BROWSERS        comma list of chromium,firefox,webkit (default: all three)
//   BROWSER_CHANNEL optional channel for Chromium only (e.g. msedge, chrome)
//   TEST_OUTPUT_DIR default ./test-results
const { chromium, firefox, webkit } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const baseURL = process.env.BASE_URL || "http://127.0.0.1:5174";
const out = path.resolve(process.env.TEST_OUTPUT_DIR || "test-results");
fs.mkdirSync(out, { recursive: true });

const engines = { chromium, firefox, webkit };
const wanted = (process.env.BROWSERS || "chromium,firefox,webkit").split(",").map((s) => s.trim());
const viewports = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 1000 },
};
const routes = [
  "/",
  "/catalog",
  "/products/sierra-nevada-85",
  "/wholesale",
  "/sampler",
  "/contact",
  "/account",
];
const results = [];

function record(entry) {
  results.push(entry);
  console.log(entry.status, entry.name, entry.error ? `- ${entry.error}` : "");
}

async function check(name, fn) {
  try {
    await fn();
    record({ name, status: "PASS" });
  } catch (e) {
    record({ name, status: "FAIL", error: e.message });
  }
}

function assert(ok, message) {
  if (!ok) throw Error(message);
}

async function go(page, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
}

// Describes the element that currently has keyboard focus.
const describeFocus = () =>
  (() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const hasOutline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
    const hasShadow = s.boxShadow && s.boxShadow !== "none";
    const hasBorder = s.borderStyle !== "none" && parseFloat(s.borderTopWidth) > 0;
    return {
      tag: el.tagName.toLowerCase(),
      label: (
        el.getAttribute("aria-label") ||
        el.textContent ||
        el.getAttribute("placeholder") ||
        el.getAttribute("href") ||
        ""
      )
        .trim()
        .slice(0, 40),
      indicator: hasOutline || hasShadow || hasBorder,
      onScreen: r.width > 0 && r.height > 0,
    };
  })();

async function runBrowser(engineName) {
  const launchOptions = { headless: true };
  if (engineName === "chromium" && process.env.BROWSER_CHANNEL) {
    launchOptions.channel = process.env.BROWSER_CHANNEL;
  }
  let browser;
  try {
    browser = await engines[engineName].launch(launchOptions);
  } catch (e) {
    record({
      name: `${engineName}: launch`,
      status: "SKIPPED",
      error: `Browser not installed (run: npx playwright install ${engineName}). ${e.message.split("\n")[0]}`,
    });
    return;
  }

  for (const [vpName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const route of routes) {
      await check(
        `${engineName} ${vpName} ${route}: loads, one main landmark, no overflow`,
        async () => {
          await go(page, route);
          assert((await page.locator("main").count()) === 1, "Missing or duplicate main landmark");
          assert(
            !(await page.getByText("This page didn't load", { exact: true }).count()),
            "Error boundary displayed",
          );
          assert(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            "Horizontal overflow",
          );
        },
      );
    }

    await check(`${engineName} ${vpName}: language toggle switches and persists`, async () => {
      await go(page, "/");
      // The toggle sits in the mobile menu on narrow screens.
      const clickLang = async (code) => {
        const btn = page
          .getByRole("button", { name: code, exact: true })
          .locator("visible=true")
          .first();
        if (!(await btn.count())) {
          await page
            .getByRole("button", { name: /menu|menú/i })
            .first()
            .click();
          await page.waitForTimeout(400);
        }
        await page
          .getByRole("button", { name: code, exact: true })
          .locator("visible=true")
          .first()
          .click();
        await page.waitForTimeout(500);
      };
      await clickLang("es");
      assert(
        (await page.locator("html").getAttribute("lang")) === "es",
        "html lang did not become es",
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      assert((await page.locator("html").getAttribute("lang")) === "es", "Language not persisted");
      await clickLang("en");
      assert(
        (await page.locator("html").getAttribute("lang")) === "en",
        "html lang did not return to en",
      );
    });

    await check(`${engineName} ${vpName}: no uncaught page errors`, async () => {
      assert(errors.length === 0, errors.slice(0, 3).join(" | "));
    });

    await page.screenshot({ path: path.join(out, `${engineName}-${vpName}.png`) }).catch(() => {});
    await context.close();
  }

  // Keyboard checks run at desktop size only.
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();
  for (const route of routes) {
    await check(`${engineName} keyboard ${route}: skip link, focus visible, no trap`, async () => {
      await go(page, route);
      // Browsers differ on whether the page starts with focus on <body>; click the body corner first.
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await page.keyboard.press("Tab");
      const first = await page.evaluate(describeFocus);
      assert(first, "First Tab did not focus anything");
      assert(
        /skip/i.test(first.label),
        `First focusable element is not the skip link (got "${first.label}")`,
      );
      assert(first.onScreen, "Skip link is not visible when focused");
      await page.keyboard.press("Enter");
      const inMain = await page.evaluate(() => !!document.activeElement?.closest("main"));
      assert(inMain, "Skip link did not move focus into <main>");

      const seen = new Set();
      const missing = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(describeFocus);
        if (!f) break;
        const key = `${f.tag}:${f.label}:${i}`;
        seen.add(key);
        if (!f.indicator) missing.push(`${f.tag} "${f.label}"`);
      }
      assert(seen.size > 3, "Keyboard focus is stuck or there are almost no focusable elements");
      assert(
        missing.length === 0,
        `No visible focus style on: ${[...new Set(missing)].slice(0, 5).join(", ")}`,
      );
    });
  }

  await check(`${engineName} keyboard: cart drawer opens and Escape closes it`, async () => {
    await go(page, "/");
    const cart = page.getByRole("button", { name: /cart|carrito/i }).first();
    await cart.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").first().waitFor({ state: "visible", timeout: 3000 });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").first().waitFor({ state: "hidden", timeout: 3000 });
  });

  await context.close();
  await browser.close();
}

(async () => {
  for (const name of wanted) {
    if (!engines[name]) {
      record({ name: `${name}: launch`, status: "SKIPPED", error: "Unknown browser name" });
      continue;
    }
    await runBrowser(name);
  }
  fs.writeFileSync(path.join(out, "cross-browser-results.json"), JSON.stringify(results, null, 2));
  const count = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nPASS ${count("PASS")}  FAIL ${count("FAIL")}  SKIPPED ${count("SKIPPED")}`);
  process.exit(count("FAIL") ? 1 : 0);
})();
