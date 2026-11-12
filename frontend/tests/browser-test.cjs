const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve(process.env.TEST_OUTPUT_DIR || "test-results");
fs.mkdirSync(out, { recursive: true });
const baseURL = process.env.BASE_URL || "http://127.0.0.1:5174";
const results = [];
const errors = [];
let page;
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
  } catch (e) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, "browser-failure.png") }).catch(() => {});
    results.push({ name, status: "FAIL", error: e.message });
  }
  console.log(results.at(-1));
}
function assert(ok, message) {
  if (!ok) throw Error(message);
}
(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const go = async (route) => {
    await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  };
  const visible = async (text) =>
    page.getByText(text, { exact: true }).first().waitFor({ state: "visible" });
  for (const route of [
    "/",
    "/catalog",
    "/products/sierra-nevada-85",
    "/wholesale",
    "/sampler",
    "/contact",
    "/account",
    "/products/missing",
    "/missing",
  ]) {
    await check(`Desktop route ${route}`, async () => {
      await go(route);
      assert((await page.locator("main").count()) === 1, "Missing main landmark");
      assert(
        !(await page.getByText("This page didn't load", { exact: true }).count()),
        "Error boundary displayed",
      );
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "Horizontal overflow",
      );
    });
  }
  await check("Student 2: language persists across refresh", async () => {
    await go("/catalog");
    await page.getByRole("button", { name: "es", exact: true }).first().click();
    await visible("Catálogo gourmet");
    await page.reload();
    await page.waitForTimeout(1500);
    await visible("Catálogo gourmet");
    assert(
      (await page.locator("html").getAttribute("lang")) === "es",
      "Incorrect document language",
    );
    await page.getByRole("button", { name: "en", exact: true }).first().click();
  });
  await check(
    "Student 3: search, empty results, clear filters, sort and product cart",
    async () => {
      await go("/catalog");
      await page.getByRole("textbox", { name: "Search chocolates" }).fill("sierra");
      await visible("1 product");
      await page.getByRole("textbox", { name: "Search chocolates" }).fill("no-such-chocolate");
      await visible("No chocolates match those filters.");
      await page.getByRole("button", { name: "Clear all", exact: true }).first().click();
      await visible("10 products");
      await page.getByRole("combobox", { name: "Sort" }).click();
      await page.getByRole("option", { name: "Price: low to high", exact: true }).click();
      assert(
        (await page.locator("article").first().innerText()).includes("Hispaniola"),
        "Wrong price order",
      );
      await go("/products/sierra-nevada-85");
      await page.getByRole("button", { name: "+", exact: true }).click();
      await page.getByRole("button", { name: "Add to cart", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      assert((await page.getByRole("dialog").innerText()).includes("$19.00"), "Wrong subtotal");
      await page.getByRole("button", { name: "+", exact: true }).click();
      assert(
        (await page.getByRole("dialog").innerText()).includes("$28.50"),
        "Quantity did not update",
      );
      await page.keyboard.press("Escape");
      await page.reload();
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: "Your cart", exact: true }).click();
      assert((await page.getByRole("dialog").innerText()).includes("$28.50"), "Cart not restored");
      await page.getByRole("button", { name: "Remove", exact: true }).click();
      await visible("Your cart is empty.");
      await page.keyboard.press("Escape");
    },
  );
  await check("Student 1: B2B registration, account persistence and sign out", async () => {
    await go("/account");
    await page.locator("main").getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByText("New here? Create an account", { exact: true }).click();
    await page.getByRole("button", { name: /Business partner/ }).click();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await visible("Enter your company name");
    await page.getByLabel("Full name", { exact: true }).fill("Browser Tester");
    await page.getByLabel("Company name", { exact: true }).fill("Test Chocolate Co");
    await page.locator("#auth-email").fill("buyer@example.com");
    await page.getByLabel("Password", { exact: true }).fill("demo-only-123");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await visible("Test Chocolate Co");
    await page.reload();
    await page.waitForTimeout(1500);
    await visible("Test Chocolate Co");
    assert(
      !JSON.parse(await page.evaluate(() => localStorage.getItem("solcacao.user"))).password,
      "Password was stored",
    );
  });
  await check("Student 4: four-step quote, invalid upload, saved account quote", async () => {
    await go("/wholesale");
    await page.getByRole("button", { name: /Bold dark/ }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles({
      name: "bad.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("test"),
    });
    await visible("Choose a PDF, AI, SVG or EPS file up to 20 MB.");
    await page.locator("input[type=file]").setInputFiles({
      name: "brand.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
    await visible("brand.svg");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: /Gift box/ }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    assert(
      (await page.getByLabel("Company", { exact: true }).inputValue()) === "Test Chocolate Co",
      "Profile not prefilled",
    );
    await page.getByRole("button", { name: "Submit quote request", exact: true }).click();
    await visible("Quote request received");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, "quote-success.png"), fullPage: true });
    await go("/account");
    assert(
      (await page.locator("main").innerText()).includes("SC-"),
      "Quote not visible in account",
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await visible("Sign in to see your profile, orders and quotes.");
  });
  await check("Student 5: contact validation and WhatsApp URL", async () => {
    await go("/contact");
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await visible("Enter your name");
    await visible("Enter a valid email");
    await page.getByLabel("Name", { exact: true }).fill("Tester");
    await page.locator("#c-email").fill("tester@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Please send wholesale details.");
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await visible("Demo message validated. No message was sent.");
    const href = await page
      .locator("main")
      .getByRole("link", { name: "Chat on WhatsApp", exact: true })
      .getAttribute("href");
    assert(
      new URL(href).searchParams.get("text").includes("Retail order"),
      "Incorrect WhatsApp message",
    );
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, "contact-desktop.png"), fullPage: true });
  });
  await check("Student 5: sampler 6/12 sizes, full-box guard and bilingual cart", async () => {
    await go("/sampler");
    assert(
      await page.getByRole("button", { name: "Add sampler to cart", exact: true }).isDisabled(),
      "Empty sampler can be added",
    );
    await page.getByRole("button", { name: /12 pieces/ }).click();
    const flavor = page.getByRole("button", { name: /Sierra Nevada 85%/ });
    for (let n = 0; n < 12; n++) await flavor.click();
    await visible("12 of 12 filled");
    await flavor.click();
    await visible("Your box is full");
    await page.getByRole("button", { name: /6 pieces/ }).click();
    await visible("6 of 6 filled");
    await page.getByRole("button", { name: "Add sampler to cart", exact: true }).click();
    await visible("Custom sampler · 6 pcs");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "es", exact: true }).first().click();
    await page.getByRole("button", { name: "Tu carrito", exact: true }).click();
    await visible("Surtido personalizado · 6 pzs");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "en", exact: true }).first().click();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/catalog",
    "/products/sierra-nevada-85",
    "/wholesale",
    "/sampler",
    "/contact",
    "/account",
  ]) {
    await check(`Mobile route ${route}`, async () => {
      await go(route);
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "Horizontal overflow",
      );
      if (route === "/") {
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(out, "home-mobile.png"), fullPage: true });
      }
    });
  }
  await check("Student 2: mobile menu navigation and filter drawer", async () => {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Shop", exact: true }).click();
    await visible("Gourmet catalog");
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.getByRole("dialog").getByText("Bars", { exact: true }).click();
    await page.getByRole("button", { name: /Show results/ }).click();
    await visible("6 products");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, "catalog-mobile.png"), fullPage: true });
  });
  await check("Storage corruption recovery in real browser", async () => {
    await page.evaluate(() => {
      localStorage.setItem("solcacao.cart", "{}");
      localStorage.setItem("solcacao.user", '{"type":"admin"}');
      localStorage.setItem("solcacao.quotes", "{}");
    });
    await go("/account");
    await visible("Sign in to see your profile, orders and quotes.");
  });
  results.push({
    name: "No uncaught browser exceptions",
    status: errors.length ? "FAIL" : "PASS",
    errors,
  });
  fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some((r) => r.status === "FAIL")) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
