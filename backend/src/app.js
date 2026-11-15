/**
 * Express application (no listen() here so tests can import it).
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { query } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import b2bRoutes from "./routes/b2b.routes.js";
import inquiryRoutes from "./routes/inquiries.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.set("trust proxy", 1); // behind Azure App Service / load balancer
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "200kb" }));
app.use(morgan(env.isProd ? "combined" : "dev"));

// Static product images (Student 2 asset routing). Put files in backend/public/images.
app.use(
  "/static",
  express.static(path.resolve("public"), {
    maxAge: "7d",
    immutable: true,
    setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  }),
);

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1 AS ok");
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/b2b", b2bRoutes);
app.use("/api", inquiryRoutes); // /api/contact, /api/sampler, /api/whatsapp

app.use(notFound);
app.use(errorHandler);
