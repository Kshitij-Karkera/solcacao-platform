## Project rules
- The front end talks to the Express API in `backend/` through `frontend/src/lib/api.ts` (fetch, base URL, JWT). Auth, catalog, cart sync, quotes and contact call the API; the bundled catalog in `frontend/src/lib/products.ts` is only a fallback while the API is unreachable.
- All user-facing copy goes through the `useI18n()` dictionaries in `frontend/src/lib/i18n.tsx` (EN + ES must stay in sync; ES is typed against EN).
- Shared site chrome (header, footer, cart drawer, auth dialog, WhatsApp button) is mounted once in `frontend/src/routes/__root.tsx`.