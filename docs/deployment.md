# Deployment

This guide explains how to deploy DevFlow to production safely. It is written to
be beginner-friendly: follow it top to bottom the first time.

> **Golden rules**
>
> - Never commit a real `.env` (only `.env.example` is tracked).
> - Never put secrets in `render.yaml`, `vercel.json`, or GitHub Actions.
> - Use a long, random `JWT_SECRET` in production.
> - Production cookies are `Secure` + `SameSite=Lax`, kept first-party by the
>   same-origin `/api` proxy — both apps must be served over HTTPS.

## Architecture

```text
 Browser
   │  HTTPS, cookies (credentials: include)
   ▼
 Vercel  ──────────────►  Render  ──────────────►  Neon (PostgreSQL)
 apps/web (Next.js)       apps/api (Express)        managed Postgres
 NEXT_PUBLIC_API_URL ──┘  WEB_URL ──┘ (CORS+cookie) DATABASE_URL ──┘
```

- **Frontend** (`apps/web`, Next.js) → **Vercel**.
- **Backend API** (`apps/api`, Express) → **Render** (Web Service).
- **Database** (PostgreSQL) → **Neon**.
- **ORM**: Prisma; migrations are committed to git and applied with
  `prisma migrate deploy`.

The frontend and backend live on **different domains**, but the browser reaches
the API through a same-origin `/api` proxy on the Vercel domain (a Next.js
rewrite) so the auth cookie stays first-party. This drives the CORS and cookie
settings explained below.

## Required accounts

- [Neon](https://neon.tech) — managed Postgres (free tier is fine to start).
- [Render](https://render.com) — backend Web Service.
- [Vercel](https://vercel.com) — frontend hosting.
- A GitHub repo connected to all three.

## Environment variables

### Backend (Render)

| Variable       | Required | Example / value                          | Notes |
| -------------- | -------- | ---------------------------------------- | ----- |
| `NODE_ENV`     | yes      | `production`                             | Enables `Secure` cookies (and `/api` proxy on the web side). |
| `DATABASE_URL` | yes      | `postgresql://…neon.tech/devflow?sslmode=require` | Neon connection string (pooled recommended). |
| `JWT_SECRET`   | yes      | a long random string                     | `openssl rand -hex 32`. Must be ≥ 16 chars. |
| `WEB_URL`      | yes      | `https://devflow.vercel.app`             | Your Vercel URL; allowed by CORS + cookie scope. |
| `PORT`         | no       | (injected by Render)                     | Do **not** set it; the server reads it. |
| `DIRECT_URL`   | optional | `postgresql://…neon.tech/devflow?sslmode=require` | Direct (non-pooled) URL for migrations. |
| `LOG_LEVEL`    | optional | `info`                                   | `error` \| `warn` \| `info`. |

### Frontend (Vercel)

| Variable              | Required | Example                              | Notes |
| --------------------- | -------- | ------------------------------------ | ----- |
| `NEXT_PUBLIC_API_URL` | yes      | `https://devflow-1wg5.onrender.com`  | The **absolute** backend origin. Inlined at build time and used as the destination of the Next.js `/api/*` rewrite (`apps/web/next.config.mjs`). In production the browser itself calls the relative `/api` (derived from `NODE_ENV`), so the cookie is first-party — see "CORS and cookies in production". Do **not** set this to `/api`. |

See [`.env.example`](../.env.example) for the local versions of all of these.

## Neon database setup

1. Create a Neon project and a database (e.g. `devflow`).
2. Copy the connection string from the Neon dashboard. Neon gives you two:
   - a **pooled** connection string (host contains `-pooler`), and
   - a **direct** connection string (no `-pooler`).
3. **Which URL goes where:**
   - **App runtime** (`DATABASE_URL`): the **pooled** URL handles many short-lived
     serverless-style connections well. (Using the direct URL also works for a
     single always-on Render instance — pooling just scales better.)
   - **Migrations** (`prisma migrate deploy`): use a **direct** URL. Pooled
     (pgBouncer) connections don't support all the statements migrations need.
4. Keep `sslmode=require` in the URL (Neon requires TLS).

**Keeping the implementation simple:** by default this repo runs migrations with
`DATABASE_URL` (see [`render.yaml`](../render.yaml)). If you set `DATABASE_URL`
to the **pooled** URL, set `DIRECT_URL` to the direct URL and run migrations
against it, e.g.:

```bash
DATABASE_URL="$DIRECT_URL" pnpm db:deploy
```

The Prisma schema is not wired to `DIRECT_URL` automatically (to avoid breaking
local development and CI, which have no `DIRECT_URL`). The simplest reliable
setup is: set `DATABASE_URL` to the direct URL on Render and you're done.

## Running Prisma migrations

- **Local development:** `pnpm db:migrate` (runs `prisma migrate dev`) — creates
  new migration files and applies them. Use this while developing.
- **Production / staging:** `pnpm db:deploy` (runs `prisma migrate deploy`) —
  applies already-committed migrations without generating new ones. **Never run
  `prisma migrate dev` against production.**
- Migrations live in `prisma/migrations/` and **must be committed to git** so the
  exact same schema is applied everywhere (CI already runs `migrate deploy`).
- `DATABASE_URL` for `db:deploy` must point at the **production** database.

## Render backend deployment

You can deploy via the included [`render.yaml`](../render.yaml) Blueprint, or
configure a Web Service manually. Manual settings:

| Setting            | Value |
| ------------------ | ----- |
| Service type       | Web Service |
| Runtime            | Node |
| Root directory     | `.` (repo root — this is a monorepo) |
| Build command      | `corepack enable && pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @devflow/api build && pnpm db:deploy` |
| Start command      | `pnpm --filter @devflow/api start` |
| Health check path  | `/health` |

Environment variables: set `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `WEB_URL`
(and optionally `DIRECT_URL`, `LOG_LEVEL`) as in the table above. **Do not set
`PORT`** — Render injects it and the server reads it automatically.

Notes:

- `corepack enable` ensures pnpm (pinned via the `packageManager` field) is
  available on the build image.
- Migrations run at the end of the build (`pnpm db:deploy`). On Render paid plans
  you can instead use a **Pre-Deploy Command** of `pnpm db:deploy` and drop it
  from the build command.
- The server binds to `0.0.0.0` so Render can route to it.

## Vercel frontend deployment

Configure the project in the Vercel dashboard:

| Setting          | Value |
| ---------------- | ----- |
| Framework        | Next.js |
| Root directory   | `apps/web` |
| Install command  | `pnpm install` (default) |
| Build command    | `pnpm --filter @devflow/web build` |
| Output           | (default, auto-detected) |

Environment variable: `NEXT_PUBLIC_API_URL=https://<your-render-api>` — the
**absolute** backend origin (the same-origin proxy is described below). Do not
set it to `/api`.

**Why the custom build command?** `apps/web` imports runtime validation schemas
from the workspace package `@devflow/shared`, whose compiled output is not
committed. The web `build` script (`pnpm --filter @devflow/shared build &&
next build`) compiles `@devflow/shared` first, so `pnpm --filter @devflow/web
build` produces a complete build. With Root Directory set to `apps/web`, Vercel
still installs the whole pnpm workspace from the repo root.

**Where is the API proxy?** It's a Next.js rewrite in `apps/web/next.config.mjs`
(not a `vercel.json`): `/api/:path*` → `${NEXT_PUBLIC_API_URL}/:path*`. This makes
the browser talk to the API on the Vercel origin so the auth cookie stays
first-party (see below). Keeping it in `next.config.mjs` means the destination is
driven by the `NEXT_PUBLIC_API_URL` env var — redeploying the API to a new URL is
just an env-var change, no code edit. (A `vercel.json` with `rewrites` would
override the Next.js config, so we intentionally don't ship one.)

## CORS and cookies in production

The auth session is stored in an **HTTP-only cookie** (never in `localStorage`),
so JavaScript cannot read the token.

**The cross-site cookie problem.** Vercel (`*.vercel.app`) and Render
(`*.onrender.com`) are different registrable domains, so a cookie set directly by
the Render API is a **third-party cookie** to the Vercel app. Even with the
correct `SameSite=None; Secure` flags, browsers increasingly **block third-party
cookies** (Safari by default, Chrome incognito / privacy settings), so login
"succeeds" but the cookie is never stored and `/auth/me` then returns 401 — the
user bounces back to `/login`.

**The fix — same-origin proxy.** A Next.js rewrite in `apps/web/next.config.mjs`
forwards `/api/*` to the Render API. In production the frontend calls the relative
`/api` (`getApiBaseUrl` returns `/api` when `NODE_ENV==="production"`), so the
browser only ever talks to the Vercel origin. The cookie Render sets comes back
through Vercel and is stored **first-party** to the Vercel domain. This works in
every browser, no third-party-cookie exceptions needed.

- **Proxy** (`apps/web/next.config.mjs`): `/api/:path* -> ${NEXT_PUBLIC_API_URL}/:path*`.
  Point `NEXT_PUBLIC_API_URL` at the live Render origin; if the API moves, change
  that env var (no code edit).
- **CORS** (`apps/api/src/app.ts`): still an explicit origin allowlist (`WEB_URL`,
  plus `http://localhost:3000` in development) with `credentials: true`, never a
  wildcard. (With the proxy, browser requests are same-origin, but the allowlist
  stays correct and is also used by local cross-origin dev.)
- **Cookies** (`apps/api/src/utils/jwt.ts`): `httpOnly: true`, `sameSite: "lax"`,
  `path: "/"` in every environment; `secure: true` in production (HTTPS),
  `secure: false` locally (HTTP). Because the browser reaches the API same-origin,
  the cookie is same-site/first-party and `Lax` is sufficient — no `SameSite=None`.
  The clear-cookie path uses the same flags so logout reliably removes it.
- The frontend sends `credentials: "include"` on every request
  (`apps/web/src/lib/api.ts`) so the cookie travels with the request (required for
  the cross-origin localhost dev setup; harmless and correct same-origin in prod).

If login appears to work but `/auth/me` returns 401 in production, verify:
`NEXT_PUBLIC_API_URL` on Vercel is the **absolute** Render origin (not `/api`),
`NODE_ENV=production` and `WEB_URL` are set on Render, and both apps are served
over HTTPS.

## Health check

`GET /health` returns `200` with `{ "status": "ok", "service": "devflow-api" }`.
Render is configured to poll it; it is a lightweight liveness check and does not
touch the database.

## Common deployment errors

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| API crashes on boot with "Invalid environment configuration" | A required env var is missing/invalid. The message lists each problem — set them in the Render dashboard. |
| `JWT_SECRET must be a strong secret …` | Set a ≥ 16-char random secret (not the placeholder) in production. |
| Login works but `/auth/me` is 401 in prod (esp. Safari/incognito) | Browser blocked the third-party cookie because requests aren't going through the same-origin proxy. Set `NEXT_PUBLIC_API_URL` to the **absolute** Render origin (not `/api`) so the `next.config.mjs` rewrite has a valid destination, and confirm `NODE_ENV=production` + HTTPS on both apps. Check the network tab: requests should be to `/api/...` on the Vercel domain, not to `*.onrender.com` directly. |
| Browser console: CORS error | `WEB_URL` on the API doesn't match the actual Vercel origin (scheme + host, no trailing slash). |
| `pnpm: command not found` on Render | Add `corepack enable &&` to the build command (already in `render.yaml`). |
| Migrations fail on pooled connection | Run `db:deploy` against the **direct** Neon URL (`DATABASE_URL="$DIRECT_URL" pnpm db:deploy`). |
| `@devflow/shared` not found during web build | Build command must compile shared first: `pnpm --filter @devflow/web build`. |

## Rollback basics

- **Frontend (Vercel):** open the project → Deployments → pick the last good
  deployment → **Promote to Production** (instant rollback).
- **Backend (Render):** open the service → **Events / Rollback** → redeploy the
  previous successful deploy, or push a revert commit.
- **Database:** migrations are forward-only here. To undo a schema change, write
  a new migration that reverses it and deploy that — do not hand-edit production.
  Take a Neon backup/branch before risky migrations.

## Production smoke test checklist

Run this after the first deploy and after risky changes.

**Backend (Render)**

- [ ] Open `https://<api>/health` → returns `{"status":"ok",...}`.
- [ ] API responds (no 5xx on a basic request).
- [ ] Render logs show structured JSON with **no** secret values (no JWTs,
      cookies, passwords, or `DATABASE_URL`).
- [ ] Database connection works (signup below persists).
- [ ] Signup works (`POST /auth/signup`).
- [ ] Login sets the auth cookie (`Set-Cookie` with `Secure`, `SameSite=Lax`).
- [ ] `GET /auth/me` works after login (returns the user, not 401), including in
      Safari and a Chrome incognito window.

**Frontend (Vercel)**

- [ ] Open the Vercel app URL.
- [ ] Sign up.
- [ ] Log in.
- [ ] Create an organization.
- [ ] Create a project.
- [ ] Create a task.
- [ ] Move a task on the Kanban board.
- [ ] Add a comment.
- [ ] Check the activity log shows the actions.
- [ ] Check notification behavior (assign/comment as another user).
- [ ] Log out (cookie cleared, protected pages redirect to `/login`).

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs typecheck, lint,
test, and build on every push/PR, against a throwaway Postgres with migrations
applied via `pnpm db:deploy`. This is **continuous integration only** — there is
no automatic production deployment wired up, and **no production secrets are
stored in GitHub Actions**.

If you later want CI/CD to run production migrations or trigger deploys, add the
production `DATABASE_URL`/deploy hooks as GitHub **encrypted secrets** and gate
them behind a protected environment — do not paste secrets into the workflow.
Render and Vercel can also auto-deploy on push to `main` via their own GitHub
integration (configured in their dashboards), which keeps secrets out of CI.

## Security checklist

- [ ] Never commit `.env` (only `.env.example` is tracked; `.env` is gitignored).
- [ ] `JWT_SECRET` is long, random, and unique per environment.
- [ ] Production cookies are `Secure` + `HttpOnly` + `SameSite=Lax` (first-party
      via the same-origin `/api` proxy).
- [ ] CORS uses an explicit allowlist, never `*` with credentials.
- [ ] `DATABASE_URL` is never logged or exposed to the client.
- [ ] `passwordHash` is never returned by the API (user responses select safe
      fields only).
- [ ] Logs never contain secrets (the logger redacts
      `password`/`token`/`authorization`/`cookie`/`jwt` and never logs bodies,
      headers, or cookies).
- [ ] If a secret is ever exposed, rotate it immediately (new `JWT_SECRET`
      invalidates existing sessions; rotate the DB password in Neon).
