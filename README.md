# SolCacao Artisanal Chocolate Platform

SolCacao is a full-stack, bilingual (English/Spanish) e-commerce web application for a premium single-origin cacao brand. One codebase covers the whole customer journey:

- **Accounts and security:** registration and sign-in for retail customers and B2B partners, with hashed passwords, JWT sessions and role-based access.
- **Bilingual storefront:** a responsive layout with shared navigation and full English/Spanish switching on every page.
- **Gourmet catalog and cart:** single-origin bars and truffles with search and filters (origin, cacao percentage, price), and a cart that is saved to the customer's account.
- **B2B wholesale and custom manufacturing:** a wholesale portal with a 4-step wizard for custom-branded chocolate quotes, including design file upload.
- **Personalization, contact and notifications:** a sampler box builder, a Contact Us page that stores inquiries, and email notifications recorded in the database.
- **Shared database:** a 13-table SQL Server schema behind every part of the platform.

Course project for **CSE 5335: Web Data Management** (Fall 2026), built by a team of five students.

| | Live | Documentation |
|---|---|---|
| Website | https://solcacao-web.onrender.com | [`frontend/README.md`](frontend/README.md) |
| API | https://solcacao-api.onrender.com/api/health | [`backend/README.md`](backend/README.md) |
| Database | Azure SQL Database `SolCacao` | [`backend/db/schema.sql`](backend/db/schema.sql) |

The live services run on free plans and sleep when idle: the first request after a quiet period can take about a minute.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Tech Stack](#tech-stack)
3. [Team and Responsibilities](#team-and-responsibilities)
4. [Database Design](#database-design)
5. [Core API Routes](#core-api-routes)
6. [Running It Locally](#running-it-locally)
7. [Repository Structure](#repository-structure)
8. [Implementation Roadmap](#implementation-roadmap-8-weeks)

---

## Architecture

The front end and back end are separate applications that talk only through a REST/JSON API:

```
React website  --- fetch(), JSON over HTTPS --->  Express API  <--->  Azure SQL Database
(Render)           Authorization: Bearer JWT      (Render)              (13 tables)
                                                      |
                                                      +--> Nodemailer (SMTP)   email notifications
                                                      +--> Multer              design file uploads
```

Every request is validated on the server (Zod) and answered with standard HTTP status codes. Prices, stock and permissions are always decided by the server, never by the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | React 19, TanStack Start and Router, Vite |
| Styling and icons | Tailwind CSS 4, Radix/shadcn UI components, Lucide |
| Back end | Node.js 20+, Express 4 |
| Database | SQL Server / Azure SQL Database (`mssql` driver) |
| Auth and security | JWT, bcrypt, role-based route guards, Helmet, rate limiting, CORS |
| Validation | Zod (shared approach on client and server) |
| Integrations | Nodemailer (SMTP), Multer (file uploads), Azure Blob Storage (optional) |
| Testing | Vitest and Testing Library (front end), Node test runner and Supertest (API) |
| Hosting | Render (website and API), Azure (database) |

---

## Team and Responsibilities

| Student | Name | Subsystem |
|---|---|---|
| 1 | Aditi Vishal | Authentication, Security and Databases |
| 2 | Vinay Datta Ilapuram | Core Layout, Navigation and Localization |
| 3 | Hector Quinones | Gourmet Catalog, Search and Cart State |
| 4 | Kshitij Sadanand Karkera | B2B Services and Customization Wizard |
| 5 | Suhas Surendra Kumar | Personalization, Contact and Notifications |

- **Student 1: Authentication, Security and Databases.** Sign-in dialog and account page; registration, login and profile endpoints; bcrypt hashing, JWT and role guards; the database layer, schema and scripts.
- **Student 2: Core Layout, Navigation and Localization.** Page shell, navigation, routing, the English/Spanish language system and the product images served by the API.
- **Student 3: Gourmet Catalog, Search and Cart State.** Catalog page with search and filters, the slide-out cart, and the product and cart endpoints.
- **Student 4: B2B Services and Customization Wizard.** Home page, Wholesale page and 4-step quote wizard; the B2B quote endpoints and design file storage.
- **Student 5: Personalization, Contact and Notifications.** Sampler builder, Contact Us page and WhatsApp links; the contact and sampler endpoints and email notifications with logging.

---

## Database Design

The original design is in [`SolCacao_schema.sql`](SolCacao_schema.sql). The version the API runs is [`backend/db/schema.sql`](backend/db/schema.sql): the same 13 tables, columns and relationships, plus a few additions the API needs (auto-numbered IDs, defaults and extra columns, each marked `-- +`).

### 1. Identity, B2B Profile and Support
| Table | Purpose |
|---|---|
| `Users` | All accounts (customers and partners) with hashed passwords |
| `Addresses` | Shipping and billing addresses linked to users |
| `CorporatePartners` | B2B profile details for partner accounts |
| `Inquiries` | Messages from the Contact Us page and sampler requests |

### 2. D2C Catalog, Cart and Retail Order
| Table | Purpose |
|---|---|
| `Products` | Chocolate bars and truffles with origin, cacao percentage, price and EN/ES text |
| `Inventory` | Stock level for each product (one row per product) |
| `Carts` | A customer's saved shopping cart |
| `CartItems` | Products and quantities in a cart |
| `RetailOrders` | Completed retail orders |
| `OrderItems` | Products and quantities in each order |

### 3. B2B Custom Manufacturing and Notifications
| Table | Purpose |
|---|---|
| `B2BQuoteRequests` | Custom order requests from the 4-step wizard |
| `DesignFiles` | Uploaded brand logos and design files attached to a quote |
| `NotificationLog` | Every email sent (or skipped), linked to its inquiry, order or quote |

Relationships are enforced with foreign keys; the one-to-one link between `Inventory` and `Products` is enforced with a `UNIQUE` constraint.

---

## Core API Routes

The main endpoints. The full list with request and response details is in [`backend/README.md`](backend/README.md#5-api-map).

| Method | Endpoint | Access | Payload | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | JSON user details and account type | 201 Created (with JWT) |
| POST | `/api/auth/login` | Public | JSON credentials (email, password) | 200 OK (with JWT) |
| GET | `/api/products` | Public | URL query filters (origin, cacao percentage, price, search) | 200 OK (JSON list) |
| POST | `/api/cart/persist` | User | JSON array of the full cart state | 200 OK |
| POST | `/api/b2b/quote` | Partner | Multipart form (custom order and brand logo) | 201 Created |
| POST | `/api/contact` | Public | JSON name, email, category and message | 201 Created |

---

## Running It Locally

Prerequisites: [Node.js](https://nodejs.org/) 22 LTS or newer, [Git](https://git-scm.com/), and a SQL Server database (Docker's `mcr.microsoft.com/mssql/server` image works well for local development).

```bash
git clone https://github.com/Kshitij-Karkera/solcacao-platform.git
cd solcacao-platform
```

1. **Start the API** (terminal 1): follow [`backend/README.md`](backend/README.md) to create `backend/.env`, build the database (`npm run db:migrate` and `npm run db:seed`) and run `npm run dev`. It listens on `http://localhost:4000`.
2. **Start the website** (terminal 2): follow [`frontend/README.md`](frontend/README.md), in short `cd frontend`, `npm install --legacy-peer-deps`, `npm run dev`. Open `http://localhost:5173`.

Use the **EN / ES** switch in the header to change the language.

---

## Repository Structure

```
solcacao-platform/
├── frontend/             React website            → frontend/README.md
├── backend/              Express API and database → backend/README.md
├── docs/                 Testing guide and front-end test report
├── SolCacao_schema.sql   Original database design (13 tables)
└── roadmap.md            Project roadmap
```

---

## Implementation Roadmap (8 Weeks)

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1-2 | Architecture and setup: repository, database design, routing shell, localization structure, prototype |
| 2 | 3-4 | Core development: components, client-side state, validation, accessibility |
| 3 | 5-6 | Back end and integration: Express API, Azure SQL database, server-side logic, React connected with `fetch()` |
| 4 | 7-8 | Audit, polish and launch: asset compression, query optimization, lazy loading, final deployment |