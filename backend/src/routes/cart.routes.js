/**
 * Cart persistence (Student 3) — Carts + CartItems tables; all routes require a signed-in user.
 *  GET  /api/cart           -> saved cart
 *  POST /api/cart/persist   -> replace saved cart with the full client cart state (spec 5.1)
 *  POST /api/cart/merge     -> merge a guest (localStorage) cart into the saved cart on login
 *  DELETE /api/cart         -> clear
 *
 * Prices are always re-read from the Products table; client prices are ignored so a
 * tampered cart cannot change what is charged. A custom sampler box ("sampler-…" key with a
 * size of 6 or 12) is priced from the hidden catalog rows sku "sampler-box-6" / "sampler-box-12".
 */
import { Router } from "express";
import { z } from "zod";
import { inList, parseJson, withTransaction, query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

const localized = z.object({ en: z.string().max(200), es: z.string().max(200) });
const itemSchema = z.object({
  key: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(999),
  price: z.number().min(0).max(10_000).optional(), // ignored: server prices every item
  name: localized.optional(),
  detail: localized.optional(),
  image: z.string().max(500).optional(),
  size: z.union([z.literal(6), z.literal(12)]).optional(), // sampler boxes only
});
const cartSchema = z.object({ items: z.array(itemSchema).max(100) });

const isSampler = (key) => key.startsWith("sampler-");

async function priceItems(client, items) {
  const skus = new Set();
  for (const i of items) {
    if (!isSampler(i.key)) skus.add(i.key);
    else if (i.size) skus.add(`sampler-box-${i.size}`);
  }
  const params = [];
  const { rows } = skus.size
    ? await client.query(
        `SELECT product_id, sku, price, active FROM Products WHERE sku IN (${inList(params, [...skus])})`,
        params,
      )
    : { rows: [] };
  const bySku = new Map(rows.map((r) => [r.sku, r]));

  return items.flatMap((i) => {
    if (isSampler(i.key)) {
      const box = i.size && bySku.get(`sampler-box-${i.size}`);
      return box ? [{ ...i, productId: box.product_id, unitPrice: Number(box.price) }] : [];
    }
    const p = bySku.get(i.key);
    // Unknown or inactive products are dropped.
    return p && p.active ? [{ ...i, productId: p.product_id, unitPrice: Number(p.price) }] : [];
  });
}

async function readCart(userId) {
  const { rows } = await query(
    `SELECT ci.item_key, ci.quantity, ci.unit_price, ci.meta, p.localized_name, p.image_url
       FROM Carts c
       JOIN CartItems ci ON ci.cart_id = c.cart_id
       JOIN Products p ON p.product_id = ci.product_id
      WHERE c.user_id = $1 AND c.status = 'active'
      ORDER BY ci.item_key`,
    [userId],
  );
  const items = rows.map((r) => {
    const meta = parseJson(r.meta, {});
    const productName = parseJson(r.localized_name, null);
    return {
      key: r.item_key,
      qty: r.quantity,
      price: Number(r.unit_price),
      name: isSampler(r.item_key) ? meta.name : (productName ?? meta.name),
      detail: meta.detail,
      size: meta.size,
      image: r.image_url ?? meta.image,
    };
  });
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

async function writeCart(userId, items, mode) {
  await withTransaction(async (c) => {
    // Find (or create) the user's single active cart. The lock stops two requests creating two.
    const found = await c.query(
      `SELECT cart_id FROM Carts WITH (UPDLOCK, HOLDLOCK) WHERE user_id = $1 AND status = 'active'`,
      [userId],
    );
    let cartId = found.rows[0]?.cart_id;
    if (!cartId) {
      const created = await c.query(
        `INSERT INTO Carts (user_id, status) OUTPUT INSERTED.cart_id VALUES ($1, 'active')`,
        [userId],
      );
      cartId = created.rows[0].cart_id;
    }
    if (mode === "replace") await c.query(`DELETE FROM CartItems WHERE cart_id = $1`, [cartId]);

    const qty = mode === "merge" ? "t.quantity + s.quantity" : "s.quantity";
    for (const i of await priceItems(c, items)) {
      const meta = { name: i.name, detail: i.detail, image: i.image, size: i.size };
      await c.query(
        `MERGE CartItems WITH (HOLDLOCK) AS t
         USING (SELECT $1 AS cart_id, $2 AS item_key, $3 AS product_id, $4 AS quantity, $5 AS unit_price, $6 AS meta) AS s
            ON t.cart_id = s.cart_id AND t.item_key = s.item_key
         WHEN MATCHED THEN UPDATE SET
           quantity = CASE WHEN ${qty} > 999 THEN 999 ELSE ${qty} END,
           unit_price = s.unit_price, product_id = s.product_id, meta = s.meta
         WHEN NOT MATCHED THEN INSERT (cart_id, item_key, product_id, quantity, unit_price, meta)
           VALUES (s.cart_id, s.item_key, s.product_id, s.quantity, s.unit_price, s.meta);`,
        [cartId, i.key, i.productId, i.qty, i.unitPrice, meta],
      );
    }
  });
}

router.get(
  "/",
  asyncHandler(async (req, res) => res.json(await readCart(req.user.id))),
);

router.post(
  "/persist",
  validate(cartSchema),
  asyncHandler(async (req, res) => {
    await writeCart(req.user.id, req.body.items, "replace");
    res.json(await readCart(req.user.id));
  }),
);

router.post(
  "/merge",
  validate(cartSchema),
  asyncHandler(async (req, res) => {
    await writeCart(req.user.id, req.body.items, "merge");
    res.json(await readCart(req.user.id));
  }),
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await query(
      `DELETE FROM CartItems
        WHERE cart_id IN (SELECT cart_id FROM Carts WHERE user_id = $1 AND status = 'active')`,
      [req.user.id],
    );
    res.status(204).end();
  }),
);

export default router;
