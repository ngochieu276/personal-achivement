# Personal Record

Track personal KPIs by project and subject. Log the time or repeats you have finished in the current period. When a period ends, the API writes a **finish** or **miss** event, updates streak, and appends history.

## Stack

- **web/** Vite + React + TanStack Query + shadcn/Tailwind + Zustand
- **api/** Deno 2 + Hono + Prisma 7 + PostgreSQL
- Local Postgres via Docker Compose (or Prisma Postgres)
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
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

App: http://localhost:5173

Register with name, email, and password, create a project, add a subject, then set current progress for the period.

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

Point the frontend at the API:

```bash
# web/.env or your static host env
VITE_API_URL=https://personal-record.fly.dev
```

Then `npm run build` in `web/` and host `web/dist` anywhere (Vercel, Netlify, or similar).

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
