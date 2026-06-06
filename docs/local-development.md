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

## Quality Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
