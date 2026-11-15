/**
 * End-to-end API tests. Requires an Azure SQL / SQL Server database with schema + seed applied:
 *   (set DB_* in .env) npm run db:migrate && npm run db:seed && npm test
 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.JWT_SECRET ??= "test-secret-test-secret-test-secret-123456";
const { app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
after(() => pool.end());

const uid = Date.now();
let retailToken, b2bToken, quoteRef;

test("register retail user -> 201 with token, customer role only", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Ana",
      email: `ana${uid}@test.com`,
      password: "secret123",
      accountType: "retail",
      role: "chocolate-lover",
    });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.deepEqual(res.body.user.roles, ["customer"]);
  retailToken = res.body.token;
});

test("register b2b without company -> 400", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Luis",
      email: `luis${uid}@test.com`,
      password: "secret123",
      accountType: "b2b",
    });
  assert.equal(res.status, 400);
});

test("register b2b pastry chef -> partner role + company", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Luis",
      email: `luis${uid}@test.com`,
      password: "secret123",
      accountType: "b2b",
      role: "pastry-chef",
      company: "Hotel Sol",
    });
  assert.equal(res.status, 201);
  assert.ok(res.body.user.roles.includes("partner"));
  assert.equal(res.body.user.role, "pastry-chef");
  assert.equal(res.body.user.company, "Hotel Sol");
  b2bToken = res.body.token;
});

test("duplicate email -> 409", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Ana",
      email: `ana${uid}@test.com`,
      password: "secret123",
      accountType: "retail",
    });
  assert.equal(res.status, 409);
});

test("login wrong password -> 401, right password -> 200 + JWT", async () => {
  const bad = await request(app)
    .post("/api/auth/login")
    .send({ email: `ana${uid}@test.com`, password: "nope" });
  assert.equal(bad.status, 401);
  const ok = await request(app)
    .post("/api/auth/login")
    .send({ email: `ana${uid}@test.com`, password: "secret123" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
});

test("GET /api/auth/me without token -> 401", async () => {
  assert.equal((await request(app).get("/api/auth/me")).status, 401);
});

test("GET /api/products filters by origin and cacao range", async () => {
  const res = await request(app).get("/api/products?origin=Ecuador&minPct=60&sort=price-asc");
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0);
  for (const p of res.body.data) {
    assert.equal(p.origin, "Ecuador");
    assert.ok(p.cacaoPct >= 60);
  }
});

test("GET /api/products paginates", async () => {
  const res = await request(app).get("/api/products?limit=3&page=1");
  assert.equal(res.body.data.length, 3);
  assert.ok(res.body.pagination.total >= 3);
});

test("cart persist ignores client prices and drops unknown products", async () => {
  const res = await request(app)
    .post("/api/cart/persist")
    .set("Authorization", `Bearer ${retailToken}`)
    .send({
      items: [
        { key: "sierra-nevada-85", qty: 2, price: 0.01 },
        { key: "fake", qty: 1 },
      ],
    });
  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].price, 9.5);
  assert.equal(res.body.subtotal, 19);
});

test("cart merge adds guest quantities on login", async () => {
  const res = await request(app)
    .post("/api/cart/merge")
    .set("Authorization", `Bearer ${retailToken}`)
    .send({
      items: [
        { key: "sierra-nevada-85", qty: 1 },
        { key: "sampler-1", qty: 1, size: 6 },
      ],
    });
  const bar = res.body.items.find((i) => i.key === "sierra-nevada-85");
  const box = res.body.items.find((i) => i.key === "sampler-1");
  assert.equal(bar.qty, 3);
  assert.equal(box.price, 16.5); // 6 pieces x $2.75
});

test("addresses: create, list, delete", async () => {
  const auth = { Authorization: `Bearer ${retailToken}` };
  const created = await request(app)
    .post("/api/auth/addresses")
    .set(auth)
    .send({ label: "Home", line1: "1 Main St", city: "Austin", country: "USA", isDefault: true });
  assert.equal(created.status, 201);
  assert.equal(created.body.address.line1, "1 Main St");
  const list = await request(app).get("/api/auth/addresses").set(auth);
  assert.equal(list.body.addresses.length, 1);
  const del = await request(app).delete(`/api/auth/addresses/${created.body.address.id}`).set(auth);
  assert.equal(del.status, 204);
});

test("retail user cannot request a B2B quote -> 403", async () => {
  const res = await request(app)
    .post("/api/b2b/quote")
    .set("Authorization", `Bearer ${retailToken}`);
  assert.equal(res.status, 403);
});

test("partner submits multipart quote with PDF -> 201", async () => {
  const res = await request(app)
    .post("/api/b2b/quote")
    .set("Authorization", `Bearer ${b2bToken}`)
    .field("company", "Hotel Sol")
    .field("contactName", "Luis")
    .field("contactEmail", "luis@hotelsol.com")
    .field("profile", "floral")
    .field("packaging", "giftbox")
    .field("quantity", "1000")
    .field("finishes", "Gold foil,Ribbon")
    .attach("brandFile", Buffer.from("%PDF-1.4 test"), {
      filename: "logo.pdf",
      contentType: "application/pdf",
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.match(res.body.ref, /^SC-[0-9A-F]{6}$/);
  quoteRef = res.body.ref;
  const list = await request(app).get("/api/b2b/quotes").set("Authorization", `Bearer ${b2bToken}`);
  assert.equal(list.body.quotes[0].ref, res.body.ref);
  assert.deepEqual(list.body.quotes[0].finishes, ["Gold foil", "Ribbon"]);
});

test("partner can read one quote by reference; others get 404", async () => {
  const ok = await request(app)
    .get(`/api/b2b/quotes/${quoteRef}`)
    .set("Authorization", `Bearer ${b2bToken}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.quote.contactEmail, "luis@hotelsol.com");
  assert.equal(ok.body.quote.fileName, "logo.pdf");
  const missing = await request(app)
    .get("/api/b2b/quotes/SC-000000")
    .set("Authorization", `Bearer ${b2bToken}`);
  assert.equal(missing.status, 404);
});

test("quote below 500 units -> 400", async () => {
  const res = await request(app)
    .post("/api/b2b/quote")
    .set("Authorization", `Bearer ${b2bToken}`)
    .field("company", "X")
    .field("contactName", "Y")
    .field("contactEmail", "y@x.com")
    .field("profile", "bold")
    .field("packaging", "tin")
    .field("quantity", "100");
  assert.equal(res.status, 400);
});

test("contact form validates and stores", async () => {
  const bad = await request(app)
    .post("/api/contact")
    .send({ name: "A", email: "bad", category: "general", message: "hi" });
  assert.equal(bad.status, 400);
  const ok = await request(app).post("/api/contact").send({
    name: "Ana",
    email: "ana@test.com",
    category: "wholesale",
    message: "I would like pricing for 2,000 bars.",
  });
  assert.equal(ok.status, 201);
});

test("DB trigger blocks reserving more stock than is on hand", async () => {
  // Pick any product's inventory row and try to reserve 1 more unit than exists.
  const { rows } = await pool.query(
    "SELECT TOP 1 inventory_id, quantity_on_hand FROM Inventory ORDER BY inventory_id",
  );
  assert.ok(rows[0], "seed data should include inventory rows");
  await assert.rejects(
    pool.query("UPDATE Inventory SET reserved_quantity = $1 WHERE inventory_id = $2", [
      rows[0].quantity_on_hand + 1,
      rows[0].inventory_id,
    ]),
    /Inventory rule broken/,
  );
});
