/** 404 + central error handler. Never leaks stack traces in production. */
import multer from "multer";
import { env } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message, code: err.code });
  }
  // SQL Server unique constraint / unique index violation (2627 / 2601)
  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({ error: "Resource already exists" });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    error: status >= 500 && env.isProd ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
