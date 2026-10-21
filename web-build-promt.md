# Build prompt — Personal Record style app

Use this as the system of work for a new project. Take the **latest stable** of each tool. Do **not** pin to the versions used in Personal Record.

You are building a small product with one frontend domain and one API. Prefer the patterns below over inventing a second architecture.

---

## Goal

A single-user (or per-user) web app:

- Public marketing site on `/`
- Guest auth on `/login` and `/register`
- Signed-in app on other paths (home of the app is **not** `/`)
- One API origin, JWT auth, PostgreSQL

Do not mix marketing and app chrome. Logged-in users hitting guest routes go to the app home. Logged-out users hitting app routes go to `/login`.

---

## Tech stack (latest, not locked)

### Frontend (`web/`)

- **Next.js App Router** + React + TypeScript (strict)
- **Tailwind CSS** with CSS variables / `@theme` (v4-style), not a large `tailwind.config` unless needed
- **shadcn/ui** New York style, `baseColor: neutral`, Lucide icons, `class-variance-authority` + `clsx` + `tailwind-merge` (`cn()`)
- **TanStack Query** for server state
- **Zustand** + `persist` for client state (auth token, locale, view prefs)
- **Motion** (`motion/react`) with `reducedMotion="user"`
- Optional: Recharts only when you need charts
- Lint with **oxlint**
- Path alias `@/*` → `src/*`

Dev server port: **5173** (keep this if CORS / OAuth / env already assume it).

Env (public):

- `NEXT_PUBLIC_API_URL` — API origin
- `NEXT_PUBLIC_SITE_URL` — this frontend origin
- optional `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Backend (`api/`)

- **Deno** (not Node for the server process)
- **Hono** HTTP framework
- **Zod** for request validation
- **Prisma** + **PostgreSQL** (`@prisma/adapter-pg` + `pg`)
- JWT via **jose**; passwords via **bcryptjs**
- Optional Google ID token login
- CORS allowlist: localhost + production frontend origin(s)

Env:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN` (comma-separated extra origins)
- `PORT` (default `8080`)
- optional `GOOGLE_CLIENT_ID`
- optional Cloudinary URL/secret if you upload images

### Infra

- Local Postgres: Docker Compose, host port **5433** to avoid clashing with 5432
- Frontend: one **Vercel** project, root directory `web`
- API: **Fly.io**, `internal_port` 8080, health check `GET /health`
- Production DB: Prisma Postgres (or any Postgres). `DATABASE_URL` is a **Fly secret**, never baked into the image
- Release command: `prisma migrate deploy`

---

## Repository layout

```
api/                    Deno Hono API
  main.ts               CORS, mounts, health, Deno.serve
  auth.ts               JWT middleware
  db.ts                 Prisma client + pg adapter
  cache.ts              short in-memory read cache + invalidate on write
  prisma/schema.prisma
  prisma/migrations/
  routes/*.ts           one file per resource
  fly.toml
  Dockerfile            denoland/deno, generate Prisma at build, `deno run -A main.ts`
web/                    Next.js app
  app/                  App Router only (thin route files)
    page.tsx            public landing
    login/ register/    guest
    (app)/              signed-in shell
  src/
    views/              page-level screens
    components/
      ui/               shadcn primitives
      layout/           sidebar, header, breadcrumbs, auth gates
      shared/           FormDialog, ConfirmDialog, buttons
      <domain>/         feature components
    i18n/               en.ts + vi.ts + useI18n()
    lib/                api client, types, formatters
    stores/             zustand persist
```

Do not put real page UI in `app/**/page.tsx`. Each route is a `"use client"` wrapper that renders a view from `src/views`.

```tsx
// app/(app)/projects/page.tsx
"use client";
import { ProjectsPage } from "@/views/projects/ProjectsPage";
export default function ProjectsRoute() {
  return <ProjectsPage />;
}
```

---

## Frontend architecture

### Routing and shells

- `(app)/layout.tsx` → `ProtectedShell` → `AppLayout` (sidebar + header + scroll area)
- Guest routes use `GuestShell` (send already-logged-in users to app home, e.g. `/projects`)
- No Next `middleware.ts` auth. Gate on the client after Zustand persist hydrates (avoid flash)
- App home is **`/projects`** (or the product’s main list). Do not use `/` as the signed-in home
- Sidebar / logo / back links that used to point at `/` must point at app home

### Data fetching

- One `api<T>(path, init)` helper: attaches `Authorization: Bearer`, JSON content-type unless `FormData`, throws `ApiError` with `{ error: string }`
- Query keys are arrays: `["projects"]`, `["subject", id]`, `["nav"]`
- Mutations `invalidateQueries` (and `setQueryData` when you already have the response)
- Default QueryClient: `staleTime` ~60s, `refetchOnWindowFocus: false`

### UI composition

- Split by function: page view + small domain components + shared dialogs. Do not dump a whole feature into one file
- Reuse `Page` / `PageHeader`, `FormDialog`, `ConfirmDialog`, `ListPlaceholder`, `PageLoading`
- Forms: local React state, native inputs + shadcn `Button` / `Input` / `Label`. Select often a native `<select>` with a shared class string
- Cards are clickable to navigate; stop propagation on inner forms/buttons
- Overflow actions go in a `…` menu, not a row of equally loud buttons
- Prefer existing tokens over new hex colors

### Visual language

- Palette: cool “stormy morning” — light blue-gray background, navy primary, soft card white
- Fonts: serif for titles (`font-serif`), sans for body (`next/font`)
- Semantic colors as CSS variables: `--hit`, `--miss`, `--streak`, `--progress` — use as Tailwind colors (`bg-miss`, `text-streak`)
- App content max width ~`max-w-6xl` except full-bleed tools (calendar)

### i18n

- Two locales: `en` and `vi`
- Nested catalogs in `en.ts`; `vi.ts` is `DeepString<typeof en>` and must mirror shape
- `useI18n()` / `t("nav.projects")` with `{var}` interpolation
- Locale in Zustand persist; language control is a **single EN/VI toggle**, not two radio options
- No hardcoded user-facing strings in views. Add keys to both catalogs when you add UI
- Format dates/units through helpers that call `t()` / `localeTag()`

### Coding style (frontend)

- TypeScript strict; explicit domain types in `src/lib/types.ts`
- `"use client"` on anything that uses Zustand, Query, or browser APIs
- `next/link` and `next/navigation` — no React Router
- Keep components focused; extract a dialog/sheet/chart instead of growing a page
- Do not commit `.env`. Do not invent new global state if Query + a small store will do
- Do not add a new UI library. Extend shadcn
- Verify UI by exercising the flow (create, edit, navigate), not a single screenshot

---

## Backend architecture

### HTTP

- `main.ts` mounts routers: `/auth`, `/projects`, `/subjects`, …
- `GET /health` → `{ ok: true }` (no auth)
- `app.use("*", cors({ origin, allowHeaders: [Content-Type, Authorization], allowMethods: [GET POST PUT PATCH DELETE OPTIONS] }))`
- Authenticated routers: `router.use("*", authMiddleware)` then `c.get("user")`

### Resources

Pattern for every resource:

1. Zod `safeParse` the body; `400` + `{ error, details: flatten() }`
2. Ownership check (`findFirst` where `userId` or `project: { userId }`); `404` if missing
3. Prisma write
4. `invalidateUserReads(userId)`
5. Return `{ entity }` or `{ ok: true }`

Errors are `{ error: string }`. Do not leak stack traces.

### Prisma

- Schema in `api/prisma/schema.prisma`; client output in-repo (`generated/prisma`, Deno runtime)
- Additive migrations in `prisma/migrations/` — never edit applied SQL
- `prisma.config.ts` reads `DATABASE_URL`
- Tasks: `db:generate`, `db:migrate`, `db:migrate:deploy`
- Relations: User → Project → child entities; `onDelete: Cascade` down the tree
- Dates: store UTC `DateTime`. Calendar-day fields: `YYYY-MM-DD` → midnight UTC. Display in the browser’s local TZ

### Coding style (backend)

- One route file per noun. Keep period/domain logic in modules (`period.ts`, `record.ts`), not inside handlers
- Validate enums and lengths in Zod, not only in Prisma
- Do not change product behavior when the task is CORS, docs, or deploy
- Secrets only in `.env` / Fly secrets — never in source. `.env.example` lists keys, not production credentials

---

## Local setup

```bash
# Postgres
docker compose up -d

# API
cd api
cp .env.example .env
deno install
deno task db:generate
deno task db:migrate:deploy   # or db:migrate
deno task dev                 # http://localhost:8080

# Web
cd web
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

---

## Build and deploy

### Web

```bash
cd web
npm run build
npm run start                 # same port 5173 if that is the contract
```

Vercel: root `web`. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`.

### API

```bash
cd api
fly deploy
```

`fly.toml`:

- `[http_service] internal_port = 8080`, HTTPS, health `GET /health`
- `[deploy] release_command` runs Prisma migrate deploy
- Secrets: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN` (include production Vercel URL and localhost)
- Dockerfile: generate Prisma with a dummy `DATABASE_URL`; runtime URL comes from secrets

When the frontend origin changes, update CORS / `FRONTEND_ORIGIN` and redeploy the API.

---

## Product conventions (adapt, don’t copy blindly)

These are how *this* product thinks. For a new app, keep the *shape*, change the nouns.

- Nested ownership: user → collections → items
- Current-period progress + closed history, not an infinite event log unless asked
- Status fields (`active` / `pending` / `ending`) are separate from the main edit form when they need a reason
- File binaries in DB only if small; images go to Cloudinary, store URL arrays
- Calendar/tasks are a separate model from KPI periods — do not overload `SubjectEvent`

---

## How to implement a feature

1. Schema + migration + Prisma generate
2. Zod + Hono routes + ownership
3. Types in `web/src/lib/types.ts`
4. i18n keys in `en.ts` and `vi.ts`
5. Split UI: view + domain components + dialog
6. Wire Query mutations and invalidate every list/detail that reads the data
7. Nav / breadcrumb / route if it is a new page
8. Exercise the flow in the running app

Do not commit unless asked. Do not force-push. Do not deploy unless asked.

---

## What not to do

- Do not pin package versions to this repo’s lockfile; use current stables
- Do not introduce Nest, tRPC, Redux, MUI, or a second CSS system
- Do not put the signed-in app on `/` if `/` is marketing
- Do not write exploits, scrape secrets, or commit `.env`
- Do not dump large copyrighted text into the repo
- Do not add features that are not requested
