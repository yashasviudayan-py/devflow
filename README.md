# DevFlow

DevFlow is a professional learning project for building a lightweight project management
platform, similar in spirit to Jira, Linear, and Trello. The goal is to practice modern
full-stack engineering habits without jumping straight into a huge product.

This repository starts with a clean monorepo scaffold, minimal working frontend and backend
apps, shared validation, PostgreSQL via Docker, Prisma, tests, linting, type checking, CI, and
documentation.

## Tech Stack

- Monorepo: pnpm workspaces
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Shared package: TypeScript types and Zod validation schemas
- Testing: Vitest
- CI: GitHub Actions
- Local services: Docker Compose

## Project Structure

```text
devflow/
  apps/
    web/          Next.js frontend
    api/          Express TypeScript API
  packages/
    shared/       Shared types and validation schemas
  prisma/         Prisma schema and future migrations
  docs/           Architecture, API, database, Git, and local development docs
  .github/        GitHub Actions workflows
```

## Local Setup

1. Install Node.js 22 or newer.
2. Install pnpm with Corepack:

```bash
corepack enable
corepack prepare pnpm@10.12.1 --activate
```

3. Install dependencies:

```bash
pnpm install
```

4. Create a local environment file:

```bash
cp .env.example .env
```

Keep `JWT_SECRET` set to a long, non-empty local secret. Never commit real production secrets.

5. Start PostgreSQL:

```bash
docker compose up -d postgres
```

6. Generate the Prisma client:

```bash
pnpm db:generate
```

7. Create the first local migration:

```bash
pnpm db:migrate
```

8. Start the frontend and backend:

```bash
pnpm dev
```

The web app runs at `http://localhost:3000`.
The API runs at `http://localhost:4000`, with health checks at `GET /health`.

## Available Scripts

- `pnpm dev` - run the web and API apps together
- `pnpm dev:web` - run only the Next.js app
- `pnpm dev:api` - run only the Express API
- `pnpm build` - build all workspace packages
- `pnpm lint` - run lint checks
- `pnpm test` - run Vitest tests
- `pnpm typecheck` - run TypeScript checks
- `pnpm db:generate` - generate the Prisma client
- `pnpm db:migrate` - create and apply a local Prisma migration (development)
- `pnpm db:deploy` - apply committed migrations (production/staging/CI)
- `pnpm db:studio` - open Prisma Studio

## Deployment

DevFlow deploys to Vercel (frontend), Render (backend API), and Neon
(PostgreSQL). See [`docs/deployment.md`](docs/deployment.md) for the full guide:
environment variables, Prisma migrations in production, CORS/cookie setup,
health checks, a smoke-test checklist, and rollback steps. An optional Render
Blueprint is provided in [`render.yaml`](render.yaml).

## Git Workflow

Use `main` for stable code, `develop` for integration work, and feature branches for small
changes:

```bash
git init
git add .
git commit -m "chore: initialize devflow monorepo"
git branch -M main
git checkout -b develop
```

Future features should be developed on branches like `feature/project-list` or
`feature/task-detail`.

## Learning Goals

- Practice Git and branch-based development
- Learn monorepo structure and package boundaries
- Build a typed frontend and backend
- Design a relational database with Prisma
- Add tests before features become large
- Use environment variables safely
- Run local infrastructure with Docker
- Keep CI green as the project grows
