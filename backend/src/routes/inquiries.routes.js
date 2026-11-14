/**
 * Contact, feedback & sampler requests (Student 5) — public, rate limited.
 * Saved in the Inquiries table; each email is recorded in NotificationLog.
 *  POST /api/contact     { name, email, category, message, company? }  -> 201
 *  POST /api/sampler     { name, email, size, picks[], message? }      -> 201
 *  GET  /api/whatsapp    -> prebuilt wa.me links (bilingual)
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/http.js";
import { layout } from "../services/mailer.js";
import { sendAndLog } from "../services/notifications.js";

const router = Router();
const limiter = rateLimit({ windowMs: 10 * 60_000, limit: 10, standardHeaders: true });

const WHATSAPP_NUMBER = "15551234567"; // replace with SolCacao's real number

const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(170), // "Name <email>" must fit name_email (255)
  company: z.string().trim().max(150).optional(),
  category: z.enum(["general", "wholesale", "order", "press", "feedback"]),
  message: z.string().trim().min(10).max(2000),
  lang: z.enum(["en", "es"]).default("en"),
});

const samplerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(170),
  company: z.string().trim().max(150).optional(),
  size: z.union([z.literal(6), z.literal(12)]),
  picks: z.array(z.string().max(80)).min(1).max(12),
  message: z.string().trim().max(1000).optional(),
});

async function record(data, category, extra) {
  const { rows } = await query(
    `INSERT INTO Inquiries (name_email, category, message, status, company, payload)
     OUTPUT INSERTED.inquiry_id AS id
     VALUES ($1,$2,$3,'new',$4,$5)`,
    [`${data.name} <${data.email}>`, category, data.message ?? "", data.company ?? null, extra],
  );
  return rows[0];
}

router.post(
  "/contact",
  limiter,
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    const d = req.body;
    const row = await record(d, d.category, { lang: d.lang });
    await sendAndLog(
      {
        to: d.category === "wholesale" ? env.MAIL_TO_WHOLESALE : env.MAIL_TO_SUPPORT,
        replyTo: d.email,
        subject: `[${d.category}] New message from ${d.name}`,
        html: layout("New website inquiry", [
          ["Name", d.name],
          ["Email", d.email],
          ["Company", d.company],
          ["Category", d.category],
          ["Language", d.lang],
          ["Message", d.message],
        ]),
      },
      { sourceType: "inquiry", sourceId: row.id, inquiryId: row.id },
    );
    res.status(201).json({ id: row.id, received: true });
  }),
);

router.post(
  "/sampler",
  limiter,
  validate(samplerSchema),
  asyncHandler(async (req, res) => {
    const d = req.body;
    const row = await record(d, "sampler", { size: d.size, picks: d.picks });
    await sendAndLog(
      {
        to: env.MAIL_TO_WHOLESALE,
        replyTo: d.email,
        subject: `Sampler request (${d.size} pieces) — ${d.company || d.name}`,
        html: layout("Custom sampler request", [
          ["Name", d.name],
          ["Email", d.email],
          ["Company", d.company],
          ["Box size", `${d.size} pieces`],
          ["Selection", d.picks.join(", ")],
          ["Message", d.message],
        ]),
      },
      { sourceType: "inquiry", sourceId: row.id, inquiryId: row.id },
    );
    res.status(201).json({ id: row.id, received: true });
  }),
);

router.get("/whatsapp", (req, res) => {
  const lang = req.query.lang === "es" ? "es" : "en";
  const msg = {
    en: {
      general: "Hi SolCacao! I have a question.",
      wholesale: "Hi SolCacao! I'd like a wholesale quote.",
    },
    es: {
      general: "¡Hola SolCacao! Tengo una pregunta.",
      wholesale: "¡Hola SolCacao! Quisiera una cotización mayorista.",
    },
  }[lang];
  const link = (t) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`;
  res.json({ general: link(msg.general), wholesale: link(msg.wholesale) });
});

export default router;
