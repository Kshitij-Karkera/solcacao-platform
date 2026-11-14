/**
 * Catalog (Student 3) — Products + Inventory tables.
 *  GET /api/products            public  filters: search, origin (csv), category, minPct, maxPct,
 *                                        minPrice, maxPrice, seasonal, sort, page, limit
 *  GET /api/products/origins    public  distinct origins (for filter sidebar)
 *  GET /api/products/:id        public  :id is the product sku, e.g. sierra-nevada-85
 */
import { Router } from "express";
import { z } from "zod";
import { inList, parseJson, query } from "../config/db.js";
import { validate } from "../middleware/validate.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  origin: z.string().max(300).optional(), // comma separated
  category: z.enum(["bars", "truffles", "bonbons", "seasonal"]).optional(),
  cacaoPct: z.coerce.number().int().min(0).max(100).optional(), // exact match (per spec)
  minPct: z.coerce.number().int().min(0).max(100).optional(),
  maxPct: z.coerce.number().int().min(0).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  seasonal: z.enum(["true", "false"]).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sort: z
    .enum(["featured", "price-asc", "price-desc", "cacao-asc", "cacao-desc", "newest"])
    .default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

// Whitelisted ORDER BY clauses — user input is never interpolated into SQL.
const SORTS = {
  featured: "p.seasonal DESC, p.created_at, p.product_id",
  "price-asc": "p.price ASC, p.product_id",
  "price-desc": "p.price DESC, p.product_id",
  "cacao-asc": "p.cacao_percent ASC, p.product_id",
  "cacao-desc": "p.cacao_percent DESC, p.product_id",
  newest: "p.created_at DESC, p.product_id",
};

const FROM = `FROM Products p LEFT JOIN Inventory i ON i.product_id = p.product_id`;

/** Shape a DB row like the frontend `Product` type. */
export function toProduct(r) {
  const name = parseJson(r.localized_name, {});
  const description = parseJson(r.localized_description, {});
  const notes = parseJson(r.localized_notes, {});
  return {
    id: r.sku,
    name: { en: name.en ?? "", es: name.es ?? name.en ?? "" },
    description: { en: description.en ?? "", es: description.es ?? "" },
    notes: { en: notes.en ?? "", es: notes.es ?? "" },
    origin: r.category_origin,
    cacaoPct: Number(r.cacao_percent),
    price: Number(r.price),
    weight: r.weight,
    category: r.category,
    image: r.image_url,
    seasonal: Boolean(r.seasonal),
    stock: Math.max(0, (r.quantity_on_hand ?? 0) - (r.reserved_quantity ?? 0)),
  };
}

router.get(
  "/",
  validate(listSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const where = ["p.active = 1"];
    const params = [];
    const add = (sql, value) => {
      params.push(value);
      where.push(sql.replace("?", `$${params.length}`));
    };

    // SQL Server's default collation is case-insensitive, so LIKE behaves like ILIKE.
    if (q.search)
      add(
        `CONCAT(JSON_VALUE(p.localized_name, '$.en'), ' ', JSON_VALUE(p.localized_name, '$.es'), ' ', p.category_origin) LIKE ?`,
        `%${q.search.replace(/[[%_]/g, "[$&]")}%`,
      );
    if (q.origin) {
      const origins = q.origin
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (origins.length) where.push(`p.category_origin IN (${inList(params, origins)})`);
    }
    if (q.category) add("p.category = ?", q.category);
    if (q.cacaoPct !== undefined) add("p.cacao_percent = ?", q.cacaoPct);
    if (q.minPct !== undefined) add("p.cacao_percent >= ?", q.minPct);
    if (q.maxPct !== undefined) add("p.cacao_percent <= ?", q.maxPct);
    if (q.minPrice !== undefined) add("p.price >= ?", q.minPrice);
    if (q.maxPrice !== undefined) add("p.price <= ?", q.maxPrice);
    if (q.seasonal) add("p.seasonal = ?", q.seasonal === "true" ? 1 : 0);
    if (q.inStock === "true")
      where.push("COALESCE(i.quantity_on_hand - i.reserved_quantity, 0) > 0");

    const whereSql = where.join(" AND ");
    const offset = (q.page - 1) * q.limit;

    const [list, count] = await Promise.all([
      query(
        `SELECT p.*, i.quantity_on_hand, i.reserved_quantity ${FROM}
          WHERE ${whereSql} ORDER BY ${SORTS[q.sort]}
          OFFSET $${params.length + 2} ROWS FETCH NEXT $${params.length + 1} ROWS ONLY`,
        [...params, q.limit, offset],
      ),
      query(`SELECT COUNT(*) AS total ${FROM} WHERE ${whereSql}`, params),
    ]);

    const total = count.rows[0].total;
    res.json({
      data: list.rows.map(toProduct),
      pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
    });
  }),
);

router.get(
  "/origins",
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT DISTINCT category_origin AS origin FROM Products
        WHERE active = 1 AND category_origin IS NOT NULL ORDER BY category_origin`,
    );
    res.json({ origins: rows.map((r) => r.origin) });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT p.*, i.quantity_on_hand, i.reserved_quantity ${FROM}
        WHERE p.sku = $1 AND p.active = 1`,
      [req.params.id],
    );
    if (!rows[0]) throw new HttpError(404, "Product not found");
    res.json({ data: toProduct(rows[0]) });
  }),
);

export default router;
