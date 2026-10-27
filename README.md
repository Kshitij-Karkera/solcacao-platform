# SolCacao Artisanal Chocolate Platform

SolCacao is a full-stack, bilingual (Spanish/English) e-commerce web application for a premium single-origin cacao brand. It brings the whole customer journey together in one codebase:

- **Accounts and security:** secure registration and login for retail customers and B2B partners, using hashed passwords, JWT sessions and role-based access.
- **Bilingual storefront:** a responsive layout with shared navigation and full Spanish/English language switching across every page.
- **Gourmet catalog and cart:** single-origin chocolate bars and truffles with search and multi-criteria filtering (origin, cacao percentage), a persistent slide-out shopping cart, and guest or registered checkout.
- **B2B wholesale and custom manufacturing:** a wholesale portal for hotels, corporate events and partners, with a 4-step wizard for requesting custom-branded chocolate quotes and uploading design files.
- **Personalization, contact and notifications:** personalized customer options, a Contact Us page that stores inquiries, and email notifications that are logged in the database.
- **Shared database:** a SQL Server schema of 13 related tables that backs every part of the platform.

Course project for **CSE 5335: Web Data Management** (Fall Semester), developed by a team of five students.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Team and Responsibilities](#team-and-responsibilities)
5. [Database Design](#database-design)
6. [Core API Routes](#core-api-routes)
7. [Setting Up the Database](#setting-up-the-database)
8. [Getting Started](#getting-started)
9. [Implementation Roadmap](#implementation-roadmap-8-weeks)

---

## Features

**Accounts and security**
- Registration and login for retail customers and B2B partners
- Password hashing with bcrypt and stateless JWT authentication
- Role-based route guards (public, user, partner)

**Core layout and localization**
- Responsive layout with shared navigation, header and footer
- Full Spanish/English language switching

**Gourmet catalog and cart**
- Product catalog with filtering by origin and cacao percentage, plus search
- Slide-out cart with persistent cart state
- Guest checkout and registered-user checkout
- Inventory tracking per product

**B2B wholesale and customization**
- Landing homepage and B2B Wholesale page
- Four-step custom manufacturing quote wizard
- Brand logo / design file upload for custom orders
- Quote requests stored for follow-up by the SolCacao team

**Personalization, contact and notifications**
- Personalization options for customers
- Contact Us page, with submissions stored as inquiries
- Email notifications sent through Nodemailer and recorded in a notification log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | React 18+ (Hooks, Context) |
| Styling and icons | Tailwind CSS, Lucide React |
| Back end | Node.js, Express.js |
| Database | SQL Server (relational model with primary and foreign keys) |
| Auth and security | JWT, bcrypt, role-based route guards |
| Integrations | Nodemailer (SMTP), multer (file uploads) |

> All data is modeled as relational tables with primary and foreign keys in SQL Server.

---

## System Architecture

The front end and back end are fully decoupled:

```
React front end  <--  JSON over HTTP (REST)  -->  Express API  <-->  SQL Server
                                                      |
                                                      +--> Nodemailer (SMTP)   email notifications
                                                      +--> multer              file uploads
```

The React client talks to the server only through stateless RESTful JSON APIs. Every request is validated on the server and answered with standard HTTP status codes.

---

## Team and Responsibilities

| Student | Name | Subsystem |
|---|---|---|
| 1 | Aditi Vishal | Authentication, Security and Databases |
| 2 | Vinay Datta Ilapuram | Core Layout, Navigation and Localization |
| 3 | Hector Quinones | Gourmet Catalog, Search and Cart State |
| 4 | Kshitij Sadanand Karkera | B2B Services and Customization Wizard |
| 5 | Suhas Surendra Kumar | Personalization, Contact and Notifications |

### What each subsystem covers

- **Student 1: Authentication, Security and Databases.** Registration and login endpoints, bcrypt password hashing, JWT issuing and verification, role-based route guards, and the database layer.
- **Student 2: Core Layout, Navigation and Localization.** Page shell, navigation, routing, and the Spanish/English language system.
- **Student 3: Gourmet Catalog, Search and Cart State.** Product listing and filtering, search, the slide-out cart, and cart persistence.
- **Student 4: B2B Services and Customization Wizard.** Landing homepage, B2B Wholesale page, the 4-step customization wizard, quote and design-file storage, and the `POST /api/b2b/quote` endpoint (multipart upload with multer).
- **Student 5: Personalization, Contact and Notifications.** Personalization features, the Contact Us page and inquiry handling, and email notifications with logging.

---

## Database Design

The schema is in [`SolCacao_schema.sql`](./SolCacao_schema.sql). It contains 13 tables in three groups, matching the team ER diagram.

### 1. Identity, B2B Profile and Support
| Table | Purpose |
|---|---|
| `Users` | All accounts (customers and partners) with hashed passwords and roles |
| `Addresses` | Shipping and billing addresses linked to users |
| `CorporatePartners` | B2B profile details for partner accounts |
| `Inquiries` | Messages submitted through the Contact Us page |

### 2. D2C Catalog, Cart and Retail Order
| Table | Purpose |
|---|---|
| `Products` | Chocolate bars and truffles with origin, cacao percentage and price |
| `Inventory` | Stock level for each product (one row per product) |
| `Carts` | A customer's shopping cart |
| `CartItems` | Products and quantities in a cart |
| `RetailOrders` | Completed retail orders |
| `OrderItems` | Products and quantities in each order |

### 3. B2B Custom Manufacturing and Notifications
| Table | Purpose |
|---|---|
| `B2BQuoteRequests` | Custom order requests submitted through the 4-step wizard |
| `DesignFiles` | Uploaded brand logos and design files attached to a quote |
| `NotificationLog` | Record of emails sent to users, linked to the related order, quote or inquiry |

Relationships are enforced with foreign key constraints, and the one-to-one link between `Inventory` and `Products` is enforced with a `UNIQUE` constraint.

---

## Core API Routes

| Method | Endpoint | Access | Payload | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | JSON user details and account type | 201 Created |
| POST | `/api/auth/login` | Public | JSON credentials (email, password) | 200 OK (with JWT) |
| GET | `/api/products` | Public | URL query filters (origin, percentage) | 200 OK (JSON list) |
| POST | `/api/cart/persist` | User | JSON array of the full cart state | 200 OK |
| POST | `/api/b2b/quote` | Partner | Multipart form (custom order and brand logo) | 201 Created |

---

## Setting Up the Database

### Local SQL Server Express

1. Install SQL Server Express and SQL Server Management Studio (SSMS).
2. In SSMS, connect to `localhost\SQLEXPRESS` using Windows Authentication. Tick **Trust Server Certificate** if prompted.
3. Open `SolCacao_schema.sql` and press **F5**. The script creates the `SolCacao` database and all 13 tables.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Kshitij-Karkera/solcacao-platform.git
cd solcacao-platform
```

Install and run instructions for the front end and back end will be added here as each subsystem is completed.

---

## Implementation Roadmap (8 Weeks)

| Phase | Weeks | Focus |
|---|---|---|
| 1 | 1-2 | Architecture and setup: repository, database design, routing shell, localization structure, prototype |
| 2 | 3-4 | Core development: components, REST routes, endpoint validation, client-side state |
| 3 | 5-6 | Integration: connect React to Express endpoints, security review, verify ES/EN translations |
| 4 | 7-8 | Audit, polish and launch: asset compression, query optimization, lazy loading, cloud deployment |