/**
 * Localization (Student 2) — serves the EN/ES dictionaries the React app uses.
 *  GET /api/i18n                    public  -> { languages: ["en","es"], default: "en" }
 *  GET /api/i18n/:lang              public  -> { lang, dict }           (whole dictionary)
 *  GET /api/i18n/:lang?ns=nav,cart  public  -> { lang, dict }           (only those sections)
 *
 * The dictionaries live in backend/locales/<lang>.json and are loaded once at startup.
 * Text that changes with a value is stored as a template with {placeholders},
 * e.g. "{n} in stock"; the front end keeps its own functions for those keys.
 */
import { Router } from "express";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http.js";

const router = Router();

export const LANGUAGES = ["en", "es"];
const DEFAULT_LANG = "en";

// Load each dictionary once; a missing or broken file stops the server at startup.
const DICTS = Object.fromEntries(
    LANGUAGES.map((lang) => [
        lang,
        JSON.parse(readFileSync(new URL(`../../locales/${lang}.json`, import.meta.url), "utf8")),
    ]),
);
const SECTIONS = Object.keys(DICTS[DEFAULT_LANG]);

const dictQuery = z.object({
    // Comma-separated section names, e.g. "nav,catalog"
    ns: z
        .string()
        .max(300)
        .optional()
        .transform((v) =>
            v
                ? v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
        ),
});

// Dictionaries rarely change, so let browsers cache them for an hour.
const cache = (res) => res.set("Cache-Control", "public, max-age=3600");

router.get("/", (_req, res) => {
    cache(res);
    res.json({ languages: LANGUAGES, default: DEFAULT_LANG, sections: SECTIONS });
});

router.get("/:lang", validate(dictQuery, "query"), (req, res) => {
    const { lang } = req.params;
    if (!LANGUAGES.includes(lang)) throw new HttpError(404, `Language '${lang}' is not available`);

    const { ns } = req.validatedQuery;
    const unknown = ns.filter((s) => !SECTIONS.includes(s));
    if (unknown.length) throw new HttpError(400, `Unknown section(s): ${unknown.join(", ")}`);

    const full = DICTS[lang];
    const dict = ns.length ? Object.fromEntries(ns.map((s) => [s, full[s]])) : full;
    cache(res);
    res.json({ lang, dict });
});

export default router;