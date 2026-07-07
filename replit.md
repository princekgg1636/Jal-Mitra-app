# Jal Seva (जल सेवा) — Water Jar Delivery Management

A mobile-first React PWA for small Indian water jar delivery businesses. Manage customers, record daily jar deliveries, track payments, auto-calculate udhar (balance), send WhatsApp messages, and view monthly reports — all in a Hindi/Hinglish UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/jal-seva run dev` — run the frontend (port 19059)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, TanStack Query, React Router
- API: Express 5, pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (customers, deliveries, payments, settings tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/jal-seva/src/` — React frontend (pages + components)
- `artifacts/jal-seva/src/App.tsx` — client-side routing

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen generates React Query hooks and Zod schemas
- Balance is stored as NUMERIC in DB and updated on every delivery/payment mutation
- Customer summary endpoint uses path params (`/customers/:id/summary/:year/:month`) to avoid Orval codegen naming collisions
- Route handlers use `res.json(); return;` (two statements) instead of `return res.json()` to satisfy `Promise<void>` typing in Express 5
- All backend logging uses `req.log` (pino) — never `console.log`

## Product

- Dashboard — आज की डिलीवरी stats, इस महीने कमाई, top outstanding balances
- Customer management — add/edit/deactivate customers (घर / दुकान types), search/filter
- Daily delivery entry — record jar deliveries, auto-calculate amount from rate
- Payment collection — record cash/UPI/other payments, auto-reduce udhar
- Customer detail — full delivery + payment history, monthly summary
- Reports — monthly income, outstanding balances
- Settings — business name, default jar rate, WhatsApp message templates
- WhatsApp integration — pre-filled wa.me links for sending payment reminders

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/index.ts`
- Do not use `pnpm run dev` at workspace root — run individual artifact workflows instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
