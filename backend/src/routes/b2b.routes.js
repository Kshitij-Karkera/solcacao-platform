/**
 * B2B custom manufacturing quotes (Student 4) — partner accounts only.
 * Tables: B2BQuoteRequests (the request) + DesignFiles (the uploaded brand file) + NotificationLog.
 *  POST /api/b2b/quote          multipart/form-data: fields + optional "brandFile"  -> 201
 *  GET  /api/b2b/quotes         list my quote requests
 *  GET  /api/b2b/quotes/:ref    one quote request
 */
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { parseJson, query, withTransaction } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError, asyncHandler } from "../utils/http.js";
import { ALLOWED_EXT, ALLOWED_MIME, saveUpload } from "../services/storage.js";
import { layout } from "../services/mailer.js";
import { sendAndLog } from "../services/notifications.js";

const router = Router();
router.use(requireAuth, requireRole("partner"));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (
            ALLOWED_EXT.has(ext) &&
            (ALLOWED_MIME.has(file.mimetype) || file.mimetype === "application/octet-stream")
        ) {
            cb(null, true);
        } else cb(new HttpError(400, "Unsupported file type. Use PDF, SVG, AI, EPS, PNG, JPG or ZIP."));
    },
});

const quoteSchema = z.object({
    company: z.string().trim().min(1).max(150),
    contactName: z.string().trim().min(1).max(100),
    contactEmail: z.string().trim().email().max(255),
    profile: z.enum(["bold", "floral", "fruity", "creamy"]),
    packaging: z.enum(["giftbox", "sleeve", "pillow", "tin"]),
    quantity: z.coerce.number().int().min(500).max(1_000_000),
    // Multipart sends arrays as repeated fields or a comma list: "Gold foil,Embossing"
    finishes: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .transform((v) =>
            (Array.isArray(v) ? v : v ? v.split(",") : [])
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 10),
        ),
    deadline: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .or(z.literal("").transform(() => undefined)),
    notes: z.string().trim().max(2000).optional(),
});

const newRef = () => `SC-${randomBytes(3).toString("hex").toUpperCase()}`;

router.post(
    "/quote",
    upload.single("brandFile"),
    asyncHandler(async (req, res) => {
        const parsed = quoteSchema.safeParse(req.body);
        if (!parsed.success)
            throw new HttpError(400, "Validation failed", parsed.error.flatten().fieldErrors);
        const q = parsed.data;

        const stored = req.file ? await saveUpload(req.file) : null;
        const quote = await withTransaction(async (c) => {
            const { rows } = await c.query(
                `INSERT INTO B2BQuoteRequests
           (partner_id, reference, company, contact_name, contact_email, cacao_profile, packaging,
            quantity, finishes, needed_by, branding_notes, status)
         OUTPUT INSERTED.quote_id AS id, INSERTED.reference, INSERTED.status, INSERTED.submitted_at
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'received')`,
                [
                    req.user.partner_id,
                    newRef(),
                    q.company,
                    q.contactName,
                    q.contactEmail,
                    q.profile,
                    q.packaging,
                    q.quantity,
                    q.finishes,
                    q.deadline ?? null,
                    q.notes ?? null,
                ],
            );
            if (stored) {
                await c.query(
                    `INSERT INTO DesignFiles (quote_id, file_name, file_type, storage_url) VALUES ($1,$2,$3,$4)`,
                    [
                        rows[0].id,
                        req.file.originalname.slice(0, 255),
                        path.extname(req.file.originalname).slice(1).toLowerCase().slice(0, 20),
                        stored.url,
                    ],
                );
            }
            return rows[0];
        });

        // Notify the wholesale team; failures are logged (NotificationLog), not surfaced to the partner.
        sendAndLog(
            {
                to: env.MAIL_TO_WHOLESALE,
                replyTo: q.contactEmail,
                subject: `New custom quote ${quote.reference} — ${q.company}`,
                html: layout(`Custom quote request ${quote.reference}`, [
                    ["Company", q.company],
                    ["Contact", `${q.contactName} <${q.contactEmail}>`],
                    ["Cacao profile", q.profile],
                    ["Packaging", q.packaging],
                    ["Quantity", q.quantity.toLocaleString("en-US")],
                    ["Finishes", q.finishes.join(", ")],
                    ["Deadline", q.deadline],
                    ["Notes", q.notes],
                    ["Brand file", req.file?.originalname],
                ]),
                attachments: req.file
                    ? [{ filename: req.file.originalname, content: req.file.buffer }]
                    : undefined,
            },
            { sourceType: "b2b_quote", sourceId: quote.id, quoteId: quote.id },
        );

        res.status(201).json({
            ref: quote.reference,
            status: quote.status,
            createdAt: quote.submitted_at,
            fileName: req.file?.originalname,
        });
    }),
);

router.get(
    "/quotes",
    asyncHandler(async (req, res) => {
        const { rows } = await query(
            `SELECT TOP 100 q.reference AS ref, q.submitted_at AS createdAt, q.company,
              q.cacao_profile AS profile, q.packaging, q.quantity, q.finishes,
              f.file_name AS fileName, q.status
         FROM B2BQuoteRequests q LEFT JOIN DesignFiles f ON f.quote_id = q.quote_id
        WHERE q.partner_id = $1 ORDER BY q.submitted_at DESC, q.quote_id DESC`,
            [req.user.partner_id],
        );
        res.json({ quotes: rows.map((r) => ({ ...r, finishes: parseJson(r.finishes, []) })) });
    }),
);

router.get(
    "/quotes/:ref",
    asyncHandler(async (req, res) => {
        const { rows } = await query(
            `SELECT q.reference AS ref, q.submitted_at AS createdAt, q.company, q.contact_name AS contactName,
              q.contact_email AS contactEmail, q.cacao_profile AS profile, q.packaging, q.quantity,
              q.finishes, q.needed_by AS deadline, q.branding_notes AS notes,
              f.file_name AS fileName, q.status
         FROM B2BQuoteRequests q LEFT JOIN DesignFiles f ON f.quote_id = q.quote_id
        WHERE q.reference = $1 AND q.partner_id = $2`,
            [req.params.ref, req.user.partner_id],
        );
        if (!rows[0]) throw new HttpError(404, "Quote not found");
        res.json({ quote: { ...rows[0], finishes: parseJson(rows[0].finishes, []) } });
    }),
);

export default router;