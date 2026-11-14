# SolCacao API

REST/JSON backend for the SolCacao bilingual D2C + B2B chocolate platform.

**Stack:** Node.js 20 · Express 4 · **Azure SQL Database** (driver: `mssql`) · JWT + bcrypt · Zod · Multer · Nodemailer · Azure Blob Storage (optional)

## 1. Install

```bash
cd backend
npm install
cp .env.example .env     # then fill in real values
```

## 2. Azure SQL Database setup

1. Azure Portal → **SQL databases** → Create. Create (or pick) a logical server, database name `solcacao`. Use SQL authentication and note the admin login/password.
2. **Networking** on the server: allow your API host (e.g. tick "Allow Azure services" for App Service) and add your own IP for local work.
3. Fill in `.env`:
   ```
   DB_SERVER=<server>.database.windows.net
   DB_NAME=solcacao
   DB_USER=<admin login>
   DB_PASSWORD=<password>
   DB_ENCRYPT=true
   ```
4. Create the tables and load starter data:
   ```bash
   npm run db:migrate   # db/schema.sql (T-SQL, safe to re-run)
   npm run db:seed      # db/seed.sql (10 products + EN/ES dictionary)
   ```
   You can also paste both files into the portal's **Query editor** instead.

Notes: lists/objects (quote finishes, cart snapshots, form extras) are stored as JSON text with `ISJSON` checks; text columns are `NVARCHAR` so Spanish accents are kept.

## 3. Run

```bash
npm run dev      # watch mode
npm start        # production
```
Health check: `GET /api/health` → `{ "status": "ok", "db": "up" }`

## 4. Deploy (any Node host — Azure App Service example)

- Runtime: Node 20 LTS, startup command `npm start`.
- Add every variable from `.env.example` under **Configuration → Application settings**.
- Set `CORS_ORIGINS` to the exact URL(s) where the website is hosted.
- Use `STORAGE_DRIVER=azure` in production so uploads survive restarts.

## 5. API map

All bodies are JSON unless noted. Errors: `{ "error": string, "details"?: object }`.
Auth header for protected routes: `Authorization: Bearer <token>`.

| Method | Path | Access | Body / Query | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ name, email, password, accountType: "retail"\|"b2b", role?, company? (b2b required), lang? }` | 201 `{ token, user }` |
| POST | `/api/auth/login` | Public | `{ email, password }` | 200 `{ token, user }` |
| GET | `/api/auth/me` | User | – | 200 `{ user }` |
| PATCH | `/api/auth/me` | User | `{ name?, role?, lang?, company? }` | 200 `{ user }` |
| GET | `/api/auth/addresses` | User | – | 200 `{ addresses }` |
| POST | `/api/auth/addresses` | User | `{ label, line1, line2?, city, region?, postalCode?, country, isDefault }` | 201 |
| DELETE | `/api/auth/addresses/:id` | User | – | 204 |
| GET | `/api/products` | Public | `search, origin (csv), category, cacaoPct, minPct, maxPct, minPrice, maxPrice, seasonal, inStock, sort, page, limit` | 200 `{ data, pagination }` |
| GET | `/api/products/origins` | Public | – | 200 `{ origins }` |
| GET | `/api/products/:id` | Public | – | 200 `{ data }` |
| GET | `/api/cart` | User | – | 200 `{ items, count, subtotal }` |
| POST | `/api/cart/persist` | User | `{ items: [{ key, qty, size? }] }` — replaces saved cart | 200 |
| POST | `/api/cart/merge` | User | same — adds guest cart on login | 200 |
| DELETE | `/api/cart` | User | – | 204 |
| POST | `/api/b2b/quote` | Partner | **multipart/form-data**: `company, contactName, contactEmail, profile (bold\|floral\|fruity\|creamy), packaging (giftbox\|sleeve\|pillow\|tin), quantity (≥500), finishes?, deadline?, notes?, brandFile?` | 201 `{ ref, status }` |
| GET | `/api/b2b/quotes` | Partner | – | 200 `{ quotes }` |
| GET | `/api/b2b/quotes/:ref` | Partner | – | 200 `{ quote }` |
| POST | `/api/contact` | Public | `{ name, email, category (general\|wholesale\|order\|press\|feedback), message, company?, lang? }` | 201 |
| POST | `/api/sampler` | Public | `{ name, email, size (6\|12), picks: string[], company?, message? }` | 201 |
| GET | `/api/whatsapp?lang=es` | Public | – | 200 `{ general, wholesale }` links |
| GET | `/api/i18n` | Public | – | 200 `{ languages }` |
| GET | `/api/i18n/:lang` | Public | `en` or `es` | 200 `{ lang, dictionary }` |
| GET | `/static/images/*` | Public | product images | 200 |

### Roles & security
- Roles (`customer`, `partner`, `admin`) are stored in `user_roles`, assigned by the server at registration — the client can never pick its own role. B2B accounts get `partner`.
- Profile role (e.g. `pastry-chef`) is a display label stored on the user.
- Passwords: bcrypt (12 rounds). Tokens: HS256 JWT, 7-day expiry, roles re-checked from the DB on every request.
- Rate limits on login/register and contact forms; Helmet headers; CORS allow-list; parameterised SQL only.
- Cart prices are always taken from the database, never from the client.
- Uploads: max 20 MB, PDF/SVG/AI/EPS/PNG/JPG/ZIP, stored with random names (local disk or private Azure Blob container).

## 6. Database schema

| Table | Purpose |
|---|---|
| `users` | id, email (unique, case-insensitive), password_hash, name, account_type, profile_role, preferred_lang |
| `user_roles` | (user_id, role) — access control |
| `corporate_partners` | B2B company profile per user |
| `addresses` | shipping/billing addresses per user |
| `products` | catalog with EN/ES name/description/notes, origin, cacao_pct, price_cents, category |
| `inventory` | stock per product |
| `carts` / `cart_items` | one saved cart per user |
| `b2b_quote_requests` | wizard submissions, file reference, status |
| `inquiries` | contact / feedback / sampler submissions |
| `translations` | (lang, key, value) dictionaries |

Full DDL: `db/schema.sql`.

## 7. Tests

Runs every endpoint against a real Azure SQL (or SQL Server) database (use a test DB, not production):

```bash
npm run db:migrate && npm run db:seed && npm test   # uses the DB_* values in .env
```

## 8. Connecting the website

Set the API base URL in the frontend (e.g. `VITE_API_URL=https://api.solcacao.com`) and replace the mock modules:
- `src/lib/auth.tsx` → `/api/auth/register`, `/api/auth/login`, `/api/auth/me` (store the returned token)
- `src/lib/cart.tsx` → `/api/cart/merge` after login, `/api/cart/persist` on change
- `src/lib/products.ts` → `GET /api/products`
- `QuoteWizard` → `POST /api/b2b/quote` with `FormData`
- Contact & sampler pages → `/api/contact`, `/api/sampler`