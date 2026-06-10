# Local Development

This guide explains how to run DevFlow on your machine.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- Docker Desktop or another Docker Compose-compatible runtime

## Install Dependencies

```bash
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm install
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

The default `DATABASE_URL` matches the PostgreSQL container in `docker-compose.yml`.

`NEXT_PUBLIC_API_URL` tells the web app where the API runs. The web app falls back to
`http://localhost:4000`, so the default setup works without extra configuration. Note that
Next.js only loads env files from `apps/web`, so to override the API URL create
`apps/web/.env.local` with the `NEXT_PUBLIC_API_URL` value.

## Start PostgreSQL

```bash
docker compose up -d postgres
```

Check container status:

```bash
docker compose ps
```

## Run Prisma

Generate the Prisma client:

```bash
pnpm db:generate
```

Create and apply the first local migration:

```bash
pnpm db:migrate
```

Open Prisma Studio:

```bash
pnpm db:studio
```

## Run the Apps

Run both apps:

```bash
pnpm dev
```

Run the frontend only:

```bash
pnpm dev:web
```

Run the backend only:

```bash
pnpm dev:api
```

## Useful URLs

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`

## Authentication in the Web App

The frontend auth pages live at:

- `http://localhost:3000/signup` — create an account
- `http://localhost:3000/login` — log in
- `http://localhost:3000/dashboard` — authenticated user info and logout

The API stores the session JWT in an HTTP-only cookie, so the browser (not JavaScript) holds
the credential. Every frontend API call uses `credentials: "include"` so the cookie is sent
between `localhost:3000` and `localhost:4000`. The API's CORS config already allows the web
origin (`WEB_URL`) with credentials, so no extra setup is needed locally. The `/dashboard`
page checks `GET /auth/me` on load and redirects to `/login` when the session is missing or
expired.

## Quality Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
