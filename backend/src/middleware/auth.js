/**
 * JWT authentication + role-based route guards (Student 1).
 *
 *  requireAuth          -> any signed-in user (401 otherwise)
 *  optionalAuth         -> attaches req.user when a valid token is present
 *  requireRole('partner')-> user must hold the role (403 otherwise)
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { HttpError } from "../utils/http.js";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, accountType: user.account_type },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
  );
}

function readBearer(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Roles are derived from the account: every user is a "customer"; a B2B account whose
 * CorporatePartners.approval_status is "approved" is also a "partner".
 */
export function rolesFor(accountType, approvalStatus) {
  const roles = ["customer"];
  if (accountType === "b2b" && approvalStatus === "approved") roles.push("partner");
  return roles;
}

async function loadUser(payload) {
  // Re-read from the database on every request so changes to approval apply immediately.
  const { rows } = await query(
    `SELECT u.user_id AS id, u.email, u.name, u.account_type, cp.partner_id, cp.approval_status
       FROM Users u LEFT JOIN CorporatePartners cp ON cp.user_id = u.user_id
      WHERE u.user_id = $1`,
    [payload.sub],
  );
  const u = rows[0];
  return u ? { ...u, roles: rolesFor(u.account_type, u.approval_status) } : null;
}

export async function requireAuth(req, _res, next) {
  try {
    const token = readBearer(req);
    if (!token) throw new HttpError(401, "Missing bearer token");
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      throw new HttpError(
        401,
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      );
    }
    const user = await loadUser(payload);
    if (!user) throw new HttpError(401, "User no longer exists");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(req, res, next) {
  if (!readBearer(req)) return next();
  return requireAuth(req, res, next);
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    const ok = req.user.roles.some((r) => roles.includes(r) || r === "admin");
    return ok ? next() : next(new HttpError(403, "Insufficient permissions"));
  };
