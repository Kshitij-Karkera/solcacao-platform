# SolCacao Front End

The bilingual (English/Spanish) website for SolCacao: storefront, catalog, cart, sampler builder, B2B wholesale quote wizard, contact page and customer accounts. It talks to the SolCacao API in [`../backend`](../backend/README.md) with `fetch()`.

**Live:** https://solcacao-web.onrender.com

**Stack:** React 19 · TanStack Start and Router (file-based routes, server rendering) · Vite · Tailwind CSS 4 · Radix/shadcn UI components · Lucide icons · Zod · Vitest and Testing Library

---

## 1. Run it locally

Requires Node.js 22.12 or newer. Run every command in this folder (`frontend/`).

```bash
npm install --legacy-peer-deps
npm run dev
```

Open the address the terminal prints (usually `http://localhost:5173`). The page reloads when you edit a file; press `Ctrl + C` to stop.

The site expects the API at `http://localhost:4000`. Start it first (see [`backend/README.md`](../backend/README.md)); without it, sign-in, cart sync, quotes and the contact form show a "couldn't reach the server" message, and the catalog falls back to its bundled product list.

`--legacy-peer-deps` is needed because a few packages declare peer dependency ranges that npm would otherwise reject.

## 2. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run build` | Production build in `.output` |
| `npm run preview` | Preview the production build |
| `npm test` | Unit and component tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (style rules in the repo's `.prettierrc`) |

Production server: `npm run build` then `node .output/server/index.mjs` (serves on `http://localhost:3000`).

## 3. Connecting to the API

All requests go through [`src/lib/api.ts`](src/lib/api.ts), which adds the base URL, the sign-in token (`Authorization: Bearer …`) and error handling.

| Environment | API address |
|---|---|
| `npm run dev` | `http://localhost:4000` |
| Production build | `https://solcacao-api.onrender.com` |
| Either, overridden | the value of `VITE_API_URL` at build time |

The API only accepts requests from the origins in its `CORS_ORIGINS` setting (the live site and `http://localhost:5173`). If you run the dev server on another port, add that address there.

| Feature | Module | Endpoints |
|---|---|---|
| Sign-in, registration, session | `src/lib/auth.tsx`, `components/site/AuthDialog.tsx` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Catalog, product pages, home, sampler flavors | `src/lib/catalog.ts` | `GET /api/products` |
| Cart | `src/lib/cart.tsx` | `GET /api/cart`, `POST /api/cart/merge` (on sign-in), `POST /api/cart/persist` (on change) |
| B2B quote wizard | `components/site/QuoteWizard.tsx` | `POST /api/b2b/quote` (multipart, field `brandFile`) |
| Account quote history | `src/lib/auth.tsx`, `routes/account.tsx` | `GET /api/b2b/quotes` |
| Contact form | `routes/contact.tsx`, `src/lib/inquiry.ts` | `POST /api/contact` |

How the data behaves:
- **Sign-in:** the API returns a JWT, stored in `localStorage` with the profile; the password is never stored. On reload the session is confirmed with `GET /api/auth/me`, and an expired token signs the user out.
- **Catalog:** the first render uses the bundled list in `src/lib/products.ts`, then the API's list (database prices, stock and names) replaces it. If the API is asleep or unreachable, the bundled list stays and the next page visit retries.
- **Cart:** guests keep their cart in the browser. Signing in merges it into the account's saved cart; later changes are saved automatically. The server sets every price, so a tampered cart cannot change totals. Signing out clears the account's cart from the browser.
- **Quotes:** only signed-in B2B partners can submit. Finishes are sent by their English names; the reference shown (e.g. `SC-7F3K2A`) comes from the server.
- **Contact:** topics map to the API's categories (retail → order, wholesale and sample → wholesale, support → general). The form clears only after the server accepts the message.

Still demonstrations (no back end yet): checkout and payment, the newsletter form, and the WhatsApp numbers.

## 4. Project structure

```
frontend/
├── public/                 Favicon and robots.txt
├── src/
│   ├── assets/             Product and hero images (bundled fallback)
│   ├── components/
│   │   ├── site/           Header, footer, cart drawer, auth dialog, quote wizard, WhatsApp button
│   │   └── ui/             Shared UI building blocks (buttons, dialogs, forms)
│   ├── lib/
│   │   ├── api.ts          fetch() client: base URL, token, errors
│   │   ├── auth.tsx        Session and quote history
│   │   ├── catalog.ts      Live product list
│   │   ├── cart.tsx        Cart state and sync
│   │   ├── i18n.tsx        English/Spanish dictionaries
│   │   ├── inquiry.ts      Contact form validation
│   │   ├── products.ts     Product types, filters and bundled catalog
│   │   └── storage.ts      Safe localStorage helpers
│   ├── routes/             One file per page (file-based routing)
│   ├── test/               Component tests and the API stand-in (mock-api.ts)
│   └── styles.css          Design tokens and global styles
├── tests/                  Browser smoke tests (see ../docs/TESTING.md)
├── package.json
└── vite.config.ts
```

## 5. Pages

| Address | Page |
|---|---|
| `/` | Home with hero slides and the retail and B2B entry points |
| `/catalog` | Product grid with search, filters and sorting |
| `/products/<id>` | Product detail |
| `/wholesale` | B2B wholesale page with the 4-step quote wizard |
| `/sampler` | Custom sampler box builder (6 or 12 pieces) |
| `/contact` | Contact form, WhatsApp links and contact details |
| `/account` | Profile, role and B2B quote history |

Use the **EN / ES** switch in the header to change the language. All user-facing text lives in `src/lib/i18n.tsx`; the Spanish dictionary is type-checked against the English one, so a missing translation fails the type check (`npx tsc --noEmit`).

## 6. Tests

```bash
npm test            # 29 tests in 4 files
npx tsc --noEmit    # type check
npm run lint
npm run build
```

Tests never contact the real API: every test starts offline, and tests that need the API use the in-memory stand-in in `src/test/mock-api.ts`, which follows the same routes, status codes and responses as `backend/`. Browser journeys and the cross-browser check are described in [`../docs/TESTING.md`](../docs/TESTING.md).

## 7. Deployment (Render)

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install --legacy-peer-deps && npm run build` |
| Start Command | `node .output/server/index.mjs` |
| Environment | `NITRO_PRESET=node-server` |

No API setting is needed: production builds already use `https://solcacao-api.onrender.com`. Pushes to `main` that change files in `frontend/` deploy automatically.