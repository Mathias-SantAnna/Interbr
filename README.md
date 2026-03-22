<div align="center">

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=for-the-badge&logo=tailwindcss" />

<br /><br />

# InterBR — B2B Distribution Platform

**A full-stack B2B e-commerce platform for Interbrasil Distribuidora**, Brazil's leading distributor of replacement parts for chainsaws, nautical engines, pressure washers, and solar energy equipment.

[Live Demo](#) · [Backend API Docs](#api-overview) · [Report Bug](https://github.com/Mathias-SantAnna/Interbr/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Overview](#-api-overview)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🏢 Overview

InterBR is a production-ready B2B ordering portal built for **Interbrasil Distribuidora Ltda** (CNPJ 37.628.401/0001-09), headquartered in Brasília–DF. The platform replaces a manual ordering process with a self-service portal that handles the full commercial cycle:

> **Browse catalog → Add to cart → Place order → Pay via Mercado Pago → Receive NF-e automatically**

The system supports three user roles — **Client**, **Salesman**, and **Admin** — each with their own portal and permission set.

---

## 🖼 Screenshots

| Storefront | Product Page | Salesman Portal |
|------------|--------------|-----------------|
| Homepage with hero, stat strip, categories, featured products | Product detail with specifications, compatibility, and product carousel | Dashboard with KPI cards, recent orders, and client list |

| Checkout | Orders | Backoffice |
|----------|--------|------------|
| Cart summary, freight calculation, payment link generation | Order list with status badges, filters, and NF-e download | Admin dashboard with full CRUD for orders, products, clients |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | SSR/SSG framework, routing, middleware |
| **TypeScript 5** | Type safety across the entire frontend |
| **Tailwind CSS 3** | Utility-first styling with custom InterBR design tokens |
| **shadcn/ui** | Accessible component primitives (Badge, Card, etc.) |
| **Zustand** | Global state management (cart, draft orders, auth) |
| **DM Sans + DM Mono** | InterBR design system typography |

### Backend
| Technology | Purpose |
|---|---|
| **Django 4.2** | Web framework, ORM, admin panel |
| **Django REST Framework** | RESTful API with serializers and viewsets |
| **SimpleJWT** | JWT authentication (access + refresh tokens in httpOnly cookies) |
| **PostgreSQL 15** | Primary relational database |
| **Celery + Redis** | Async task queue for NF-e emission and payment processing |
| **ReportLab** | Mock DANFE PDF generation (NF-e homologation) |

### Payments & Integrations
| Service | Purpose |
|---|---|
| **Mercado Pago Checkout Pro** | Payment link generation (PIX, boleto, credit card) |
| **ViaCEP** | Brazilian postal code auto-fill |
| **BrasilAPI** | CNPJ auto-fill for company registration |
| **Briggs & Stratton** | External link to official engine manuals |

### Infrastructure
| Tool | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerized local and production environment |
| **Railway** (recommended) | Cloud deployment for Django + PostgreSQL + Redis |
| **Vercel** (recommended) | Edge-optimized Next.js deployment |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│              Next.js 14 App Router (Vercel Edge)                │
│  ┌───────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────┐  │
│  │ Storefront│  │Salesman Portal│  │  Backoffice│  │  Auth   │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬──────┘  └────┬────┘  │
└────────┼───────────────┼────────────────┼───────────────┼───────┘
         │               │  REST API /api/v1/              │
         ▼               ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Django REST Framework                         │
│  /auth/  /catalog/  /orders/  /pricing/  /fiscal/  /admin/     │
│                        │                                        │
│    ┌───────────────────┼──────────────────────┐                 │
│    │                   │                      │                 │
│    ▼                   ▼                      ▼                 │
│ PostgreSQL          Celery Worker          Redis Broker         │
│  (Orders, Users,    (NF-e emission,       (Task queue,         │
│   Products, etc.)    MP webhooks)          caching)             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **JWT in httpOnly cookies** — refresh token stored server-side for XSS protection; access token lives in React state (memory only)
- **Server Components by default** — data fetching happens on the server where possible; client components are used only for interactivity
- **Optimistic cart** — cart state is managed in Zustand with `persist` middleware (localStorage), enabling offline-first draft orders
- **Async NF-e** — fiscal emission is a Celery background task; the frontend polls the order until `nfe_pdf_url` is populated

---

## ✨ Features

### 🛒 Storefront (Client-facing)
- **Product catalog** with search, category filters, price range, and stock filters
- **Product detail page** with specifications, compatibility table, and Amazon-style related products carousel
- **Category image fallbacks** — curated Unsplash photos per product category (florestal, solar, EPI, limpeza, etc.)
- **Cart drawer** with quantity controls and real-time totals
- **Checkout** with freight calculation, promo code validation, and Mercado Pago payment link
- **Orders portal** with status tracking, NF-e download, and payment simulation
- **Offline-first draft orders** — cart persists across sessions and network outages

### 👔 Salesman Portal
- Dashboard with KPI cards (active clients, pending orders, total revenue)
- Full client list with tier badges and order history
- **New order form** — place orders on behalf of clients with line-item discounts
- **New client request** — submit a company for admin approval (pending until activated)

### 🏠 Backoffice (Admin)
- Orders management with status transitions and NF-e re-emission
- Product CRUD with image upload, NCM code, stock management
- Category management with parent/child hierarchy
- Client management with tier assignment, credit limits, payment terms
- Promo code engine with percentage and fixed discounts, usage limits
- Price list management with company-level assignments
- Sales reports with date range filters

### 📄 Serviços
- **Catálogos** page — downloadable PDF catalogs for 2-stroke, 4-stroke, nautical, diversidades, Karcher, and solar energy product lines
- **Manual Briggs** — direct link to the official Briggs & Stratton manuals portal

### 🔐 Authentication & Authorization
- Email + password login with JWT (access 15 min, refresh 7 days)
- Role-based middleware protecting `/salesman/*`, `/backoffice/*`, `/conta/*`
- Company-level data isolation — clients see only their own orders

### 📱 UX & Design
- **InterBR design system** — DM Sans + DM Mono typography, green `#16a34a` accent, clean white base
- Fully responsive (mobile-first)
- Staggered animations, status badge system, skeleton loading states
- Support page with 10-item FAQ accordion and contact form

---

## 📁 Project Structure

```
Interbr/
├── backend/                        # Django API
│   ├── apps/
│   │   ├── accounts/               # Users, Companies, JWT auth
│   │   ├── catalog/                # Products, Categories
│   │   ├── orders/                 # Orders, OrderItems
│   │   ├── pricing/                # PriceLists, PromoCodes
│   │   └── fiscal/                 # NF-e emission, mock DANFE PDF
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py            # Development settings
│   │   │   └── production.py       # Production settings
│   │   └── urls.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                       # Next.js 14 App
│   ├── app/
│   │   ├── (storefront)/           # Public pages
│   │   ├── catalog/                # Product catalog
│   │   ├── product/[slug]/         # Product detail + shoveler
│   │   ├── checkout/               # Cart → payment flow
│   │   ├── pedidos/                # Order list + detail
│   │   ├── servicos/
│   │   │   └── catalogos/          # PDF catalog downloads
│   │   ├── suporte/                # FAQ + contact form
│   │   ├── salesman/               # Salesman portal
│   │   ├── backoffice/             # Admin dashboard
│   │   ├── login/ register/        # Auth pages
│   │   └── conta/                  # Account management
│   ├── components/
│   │   ├── storefront/             # Header, ProductCard, Carousel, etc.
│   │   └── ui/                     # shadcn primitives
│   ├── lib/
│   │   ├── catalog-api.ts          # Product fetching helpers
│   │   ├── order-api.ts            # Order CRUD
│   │   ├── salesman-api.ts         # Salesman-specific endpoints
│   │   ├── cart-store.ts           # Zustand cart state
│   │   ├── draft-store.ts          # Offline draft orders
│   │   └── auth-context.tsx        # JWT auth provider
│   └── .env.local.example
│
├── docker-compose.yml              # Full stack local environment
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15
- Redis 7

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/Mathias-SantAnna/Interbr.git
cd Interbr

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit both .env files with your credentials (see Environment Variables below)

# Start everything
docker-compose up --build
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/

### Option B — Manual Setup

```bash
# ── Backend ──────────────────────────────────────
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create database
createdb interbr

# Run migrations and seed demo data
python manage.py migrate --settings=config.settings.local
python manage.py create_superuser_demo --settings=config.settings.local

# Start Django
python manage.py runserver --settings=config.settings.local

# ── Celery worker (new terminal) ─────────────────
source venv/bin/activate
celery -A config worker -l info

# ── Frontend (new terminal) ──────────────────────
cd frontend
npm install
npm run dev
```


---

## 🔑 Environment Variables

### `backend/.env`

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/interbr

# Redis / Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxx

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxx
```

---

## 🔌 API Overview

Base URL: `/api/v1/`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register/` | — | Create company + user account |
| `POST` | `/auth/token/` | — | Obtain JWT access + refresh tokens |
| `GET` | `/catalog/products/` | Optional | List products with filters |
| `GET` | `/catalog/products/{slug}/` | Optional | Product detail + compatibility |
| `GET` | `/catalog/categories/` | — | List all categories |
| `GET` | `/orders/` | ✅ | List user's orders |
| `POST` | `/orders/` | ✅ | Create new order |
| `GET` | `/orders/{id}/` | ✅ | Order detail + NF-e status |
| `POST` | `/auth/salesman/request-client/` | ✅ Salesman | Request new client approval |
| `GET` | `/admin/orders/` | ✅ Admin | All orders with filters |
| `GET` | `/admin/companies/` | ✅ Admin | All companies (incl. pending) |
| `POST` | `/admin/companies/{id}/assign_salesman/` | ✅ Admin | Assign salesman to client |

---

## ☁️ Deployment

### Backend — Railway

```bash
# Set environment variables in Railway dashboard
# Then deploy:
railway login
railway link
railway up
railway run python manage.py migrate
railway run python manage.py create_superuser_demo
```

### Frontend — Vercel

```bash
vercel --prod
# Set NEXT_PUBLIC_API_BASE_URL to your Railway backend URL
```

> ⚠️ **Important:** After deploying, run migrations manually in the Railway shell. Railway does not run them automatically and the app will crash on first load if you skip this step.

---

## 🗺 Roadmap

- [ ] Real NF-e emission via Focus NFe (production)
- [ ] Email notifications for order status changes (Celery + SendGrid)
- [ ] WhatsApp order notifications (Twilio / Z-API)
- [ ] Mobile app (React Native)
- [ ] Multi-tenant / franchise support
- [ ] Advanced analytics dashboard (sales by region, product, salesman)
- [ ] Inventory management with low-stock alerts
- [ ] B2B credit line management with automatic limit checks


---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for **Interbrasil Distribuidora Ltda** 

</div>
