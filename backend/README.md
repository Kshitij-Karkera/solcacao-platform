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
   npm run db:migrate   # db/schema.sql: the 13 SolCacao tables (T-SQL, only creates what is missing)
   npm run db:seed      # db/seed.sql: 10 products with stock (safe to re-run)
   ```
   To rebuild from scratch (**deletes all data**, also removes tables of the earlier 11-table design): `npm run db:reset`, then migrate and seed again.
   You can also paste the files into the portal's **Query editor** instead.

Notes: lists/objects (quote finishes, cart snapshots, bilingual names and descriptions, form extras) are stored as JSON text with `ISJSON` checks; text columns are `NVARCHAR` so Spanish accents are kept.

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
| GET | `/static/images/*` | Public | product images | 200 |

### Roles & security
- Roles are derived by the server, never sent by the client: every user is a `customer`; a B2B account whose `CorporatePartners.approval_status` is `approved` is also a `partner` (B2B sign-ups are currently auto-approved).
- Profile role (e.g. `pastry-chef`) is a display label stored on the user.
- Passwords: bcrypt (12 rounds). Tokens: HS256 JWT, 7-day expiry, approval re-checked from the DB on every request.
- Rate limits on login/register and contact forms; Helmet headers; CORS allow-list; parameterised SQL only.
- Cart prices are always taken from the database, never from the client.
- Uploads: max 20 MB, PDF/SVG/AI/EPS/PNG/JPG/ZIP, stored with random names (local disk or private Azure Blob container).

## 6. Database schema

The backend uses the 13-table SolCacao schema (`SolCacao_schema.sql` in the repository root). `db/schema.sql` creates the same tables, columns and relationships, plus small implementation additions (marked `-- +`): auto-numbered IDs, defaults, a unique `Users.email`, and the extra columns the API needs (product details, address line 2, quote reference/contact/finishes, inquiry company/payload).

| Table | Used for |
|---|---|
| `Users` | accounts: email (unique), password hash, name, account type, profile role, language |
| `Addresses` | shipping/billing addresses |
| `CorporatePartners` | B2B company record and approval status (gives the `partner` role) |
| `Inquiries` | contact, feedback and sampler requests |
| `Products` | catalog: `sku` (public id), bilingual name/description as JSON, origin, price, cacao %, category |
| `Inventory` | stock per product (`quantity_on_hand` - `reserved_quantity`) |
| `Carts` / `CartItems` | one active saved cart per user |
| `B2BQuoteRequests` / `DesignFiles` | wholesale quote requests and their uploaded brand file |
| `NotificationLog` | every email sent for an inquiry or quote, with its delivery status |
| `RetailOrders` / `OrderItems` | created for later (checkout is not built yet) |

Custom sampler boxes are priced from two hidden catalog rows (`sampler-box-6`, `sampler-box-12`, `active = 0`).

Full DDL: `db/schema.sql`.

## 7. Tests

Runs every endpoint against a real Azure SQL (or SQL Server) database (use a test DB, not production):

```bash
npm run db:reset && npm run db:migrate && npm run db:seed && npm test   # uses the DB_* values in .env
```

## 8. Connecting the website

Set the API base URL in the frontend (e.g. `VITE_API_URL=https://api.solcacao.com`) and replace the mock modules:
- `src/lib/auth.tsx` → `/api/auth/register`, `/api/auth/login`, `/api/auth/me` (store the returned token)
- `src/lib/cart.tsx` → `/api/cart/merge` after login, `/api/cart/persist` on change
- `src/lib/products.ts` → `GET /api/products`
- `QuoteWizard` → `POST /api/b2b/quote` with `FormData`
- Contact & sampler pages → `/api/contact`, `/api/sampler`

The earlier `/api/i18n` endpoint was removed: the 13-table schema has no translations table and the front end ships its own dictionaries.