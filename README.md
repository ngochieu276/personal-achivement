# Personal Record

Track personal KPIs by project and subject. Log the time or repeats you have finished in the current period. When a period ends, the API writes a **finish** or **miss** event, updates streak, and appends history.

## Stack

- **web/** Next.js App Router (marketing at `/`, signed-in app at `/projects` and related paths) + TanStack Query + shadcn/Tailwind + Zustand
- **api/** Deno 2 + Hono + Prisma 7 + PostgreSQL
- Local Postgres via Docker Compose (or Prisma Postgres)
- Frontend deploys to one Vercel project with root directory `web`
- Backend deploys to [Fly.io](https://fly.io/docs/js/frameworks/deno/) with [Prisma Postgres](https://www.prisma.io/postgres)

## Local development

### 1. Start Postgres

```bash
docker compose up -d
```

Postgres is on **5433** (to avoid clashing with a local 5432 install).

### 2. API

Requires [Deno 2+](https://deno.com/).

```bash
cd api
cp .env.example .env   # already set for local compose
deno install
deno run -A --env=.env npm:prisma generate
deno run -A --env=.env npm:prisma migrate deploy
deno task dev
```

API: http://localhost:8080  
Health: http://localhost:8080/health

### 3. Web

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Site: http://localhost:5173

`/` is the public landing page. `/login` and `/register` are guest routes. After sign-in, the app lives at `/projects`, `/dashboard`, `/activities`, and nested project/subject URLs.

`NEXT_PUBLIC_API_URL` is the API origin. `NEXT_PUBLIC_SITE_URL` is this frontend origin (canonical and Open Graph). `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is optional if the API already returns a Google client id.

## Product rules

- One user has many projects; one project has many subjects.
- Subject KPI is either **total time (minutes)** or **total repeats**, over **day / week / 2 weeks / month** (rolling from `startDate`).
- Progress is the current period total (set, not a log of increments).
- When a period ends:
  - `finish` if `currentProgress >= kpi`
  - `miss` otherwise
- Finish increments streak and writes `streak_hit` history. Miss resets streak to 0.
- Changing KPI writes `kpi_change` history.
- Overdue periods close on subject read/update and every minute in the API process.

## Deploy API to Fly.io

The API reads `DATABASE_URL` from Fly secrets. Production uses Prisma Postgres (not a Fly Postgres app).

From `api/`:

1. Install [flyctl](https://fly.io/docs/flyctl/install/) and `fly auth login`.
2. Create the app without deploying, then set secrets (including the Prisma Postgres connection string):

```bash
cd api
fly launch --no-deploy --copy-config --name personal-record
fly secrets set \
  DATABASE_URL="<prisma-postgres-url>" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  FRONTEND_ORIGIN="https://personal-achivement.vercel.app,http://localhost:5173"
```

3. Deploy:

```bash
fly deploy
```

`fly.toml` listens on port 8080, checks `/health`, and runs `prisma migrate deploy` as the release command.

Point the frontend at the API in Vercel (project root `web`):

```bash
NEXT_PUBLIC_API_URL=https://personal-record.fly.dev
NEXT_PUBLIC_SITE_URL=https://personal-achivement.vercel.app
```

## API overview

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` | no |
| POST | `/auth/login` | no |
| GET | `/auth/me` | JWT |
| GET/POST | `/projects` | JWT |
| GET/PATCH/DELETE | `/projects/:id` | JWT |
| GET/POST | `/projects/:id/subjects` | JWT |
| GET/PATCH/DELETE | `/subjects/:id` | JWT |
| PUT | `/subjects/:id/progress` | JWT |
| GET | `/health` | no |

Send `Authorization: Bearer <token>`.
