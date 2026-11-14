/**
 * Centralised, validated environment config. Fails fast on boot if a
 * required variable is missing so misconfigured deployments never start.
 */
import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:8080"),
  DB_SERVER: z.string().min(1, "DB_SERVER is required"), // <name>.database.windows.net
  DB_PORT: z.coerce.number().default(1433),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_ENCRYPT: z.string().default("true"), // Azure SQL requires encryption
  DB_TRUST_CERT: z.string().default("false"), // "true" only for a local SQL Server container
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  STORAGE_DRIVER: z.enum(["local", "azure"]).default("local"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().default(20),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER: z.string().default("b2b-uploads"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("SolCacao <no-reply@solcacao.com>"),
  MAIL_TO_WHOLESALE: z.string().default("wholesale@solcacao.com"),
  MAIL_TO_SUPPORT: z.string().default("hello@solcacao.com"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
