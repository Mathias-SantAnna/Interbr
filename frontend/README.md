# InterBR Frontend (Day 2)

Next.js 14+ App Router storefront for Interbrasil Distribuidora.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui

## Run locally

1. Copy env vars:
   - `cp .env.example .env.local`
2. Ensure backend is running on `localhost:8000`
3. Start frontend:
   - `npm run dev`
4. Open `http://localhost:3000`

## Implemented on Day 2

- Home page with hero, category links, featured products
- Catalog page with search and filters (`search`, `category`, `min_price`, `max_price`)
- Product detail route (`/product/[slug]`)
- Typed API integration in `lib/catalog-api.ts`

## Verify

- Lint: `npm run lint`
- Build: `npm run build`
