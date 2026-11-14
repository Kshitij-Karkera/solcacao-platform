/**
 * Auth & profile (Student 1)
 *  POST  /api/auth/register      public   -> 201 { token, user }
 *  POST  /api/auth/login         public   -> 200 { token, user }
 *  GET   /api/auth/me            user     -> 200 { user }
 *  PATCH /api/auth/me            user     -> 200 { user }
 *  GET/POST/DELETE /api/auth/addresses    user
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { query, withTransaction } from "../config/db.js";
import { requireAuth, rolesFor, signToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { HttpError, asyncHandler } from "../utils/http.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true });

const RETAIL_ROLES = ["chocolate-lover", "gift-shopper"];
const B2B_ROLES = [
  "pastry-chef",
  "chocolatier",
  "hotel-restaurant",
  "retailer",
  "event-planner",
  "corporate-gifting",
];

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(128),
    accountType: z.enum(["retail", "b2b"]),
    role: z.string().optional(),
    company: z.string().trim().max(150).optional(),
    lang: z.enum(["en", "es"]).default("en"),
  })
  .superRefine((v, ctx) => {
    if (v.accountType === "b2b" && !v.company)
      ctx.addIssue({ code: "custom", path: ["company"], message: "Company is required for B2B" });
    const allowed = v.accountType === "b2b" ? B2B_ROLES : RETAIL_ROLES;
    if (v.role && !allowed.includes(v.role))
      ctx.addIssue({ code: "custom", path: ["role"], message: "Role not valid for account type" });
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

async function getProfile(userId) {
  const { rows } = await query(
    `SELECT u.user_id AS id, u.email, u.name, u.account_type, u.[role], u.language, u.created_at,
            cp.company_name, cp.approval_status
       FROM Users u LEFT JOIN CorporatePartners cp ON cp.user_id = u.user_id
      WHERE u.user_id = $1`,
    [userId],
  );
  const u = rows[0];
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    type: u.account_type,
    role: u.role,
    company: u.company_name ?? undefined,
    companyVerified: u.approval_status == null ? undefined : u.approval_status === "approved",
    lang: u.language,
    roles: rolesFor(u.account_type, u.approval_status),
    createdAt: u.created_at,
  };
}

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, accountType, role, company, lang } = req.body;
    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user = await withTransaction(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO Users (email, password_hash, name, account_type, [role], language)
         OUTPUT INSERTED.user_id AS id, INSERTED.email, INSERTED.account_type
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [email, hash, name, accountType, role ?? null, lang],
      );
      const u = rows[0];
      // The server decides access: B2B accounts get a partner record (auto-approved for now).
      // The client can never pick its own role or approval status.
      if (accountType === "b2b") {
        await c.query(
          `INSERT INTO CorporatePartners (user_id, company_name, approval_status) VALUES ($1,$2,'approved')`,
          [u.id, company],
        );
      }
      return u;
    });

    res.status(201).json({ token: signToken(user), user: await getProfile(user.id) });
  }),
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT user_id AS id, email, account_type, password_hash FROM Users WHERE email = $1`,
      [req.body.email],
    );
    const u = rows[0];
    // Same message for unknown email and wrong password (no account enumeration).
    if (!u || !(await bcrypt.compare(req.body.password, u.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    res.json({ token: signToken(u), user: await getProfile(u.id) });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => res.json({ user: await getProfile(req.user.id) })),
);

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: z.string().max(50).optional(),
  lang: z.enum(["en", "es"]).optional(),
  company: z.string().trim().min(1).max(150).optional(),
});

router.patch(
  "/me",
  requireAuth,
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { name, role, lang, company } = req.body;
    const allowed = req.user.account_type === "b2b" ? B2B_ROLES : RETAIL_ROLES;
    if (role && !allowed.includes(role))
      throw new HttpError(400, "Role not valid for account type");
    await query(
      `UPDATE Users SET name = COALESCE($2,name), [role] = COALESCE($3,[role]),
              language = COALESCE($4,language) WHERE user_id = $1`,
      [req.user.id, name ?? null, role ?? null, lang ?? null],
    );
    if (company && req.user.account_type === "b2b") {
      await query(`UPDATE CorporatePartners SET company_name = $2 WHERE user_id = $1`, [
        req.user.id,
        company,
      ]);
    }
    res.json({ user: await getProfile(req.user.id) });
  }),
);

// ---- Addresses ----
// API field names -> Addresses columns: label=type, line1=street, line2=street2, region=state.
const addressSchema = z.object({
  label: z.string().trim().max(20).default("Home"),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(100),
  isDefault: z.boolean().default(false),
});

const ADDRESS_FIELDS = `address_id AS id, type AS label, street AS line1, street2 AS line2, city,
  state AS region, postal_code AS postalCode, country, is_default AS isDefault`;

router.get(
  "/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT ${ADDRESS_FIELDS} FROM Addresses WHERE user_id = $1 ORDER BY is_default DESC, address_id`,
      [req.user.id],
    );
    res.json({ addresses: rows });
  }),
);

router.post(
  "/addresses",
  requireAuth,
  validate(addressSchema),
  asyncHandler(async (req, res) => {
    const a = req.body;
    const row = await withTransaction(async (c) => {
      if (a.isDefault)
        await c.query(`UPDATE Addresses SET is_default = 0 WHERE user_id = $1`, [req.user.id]);
      const { rows } = await c.query(
        `INSERT INTO Addresses (user_id, type, street, street2, city, state, postal_code, country, is_default)
         OUTPUT INSERTED.address_id AS id, INSERTED.type AS label, INSERTED.street AS line1,
                INSERTED.street2 AS line2, INSERTED.city, INSERTED.state AS region,
                INSERTED.postal_code AS postalCode, INSERTED.country, INSERTED.is_default AS isDefault
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          req.user.id,
          a.label,
          a.line1,
          a.line2 ?? null,
          a.city,
          a.region ?? null,
          a.postalCode ?? null,
          a.country,
          a.isDefault,
        ],
      );
      return rows[0];
    });
    res.status(201).json({ address: row });
  }),
);

router.delete(
  "/addresses/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(404, "Address not found");
    const { rowCount } = await query(
      `DELETE FROM Addresses WHERE address_id = $1 AND user_id = $2`,
      [id, req.user.id],
    );
    if (!rowCount) throw new HttpError(404, "Address not found");
    res.status(204).end();
  }),
);

export default router;
