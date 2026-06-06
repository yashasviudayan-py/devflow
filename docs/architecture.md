# Architecture

DevFlow is organized as a pnpm monorepo with separate apps for the frontend and backend, plus a
shared package for common types and validation.

## Frontend

The frontend lives in `apps/web` and uses Next.js, TypeScript, and Tailwind CSS. It starts with a
minimal app shell and placeholder navigation for Dashboard, Projects, Tasks, and Settings.

The frontend should stay focused on presentation, routing, forms, and client-side user experience.
Business rules that must also be enforced by the API should live in the shared package or backend.

## Backend

The backend lives in `apps/api` and uses Express with TypeScript. The initial API exposes
`GET /health` and includes CORS, dotenv-based configuration, JSON parsing, not-found handling, and
central error middleware.

As the project grows, route files should stay small. Put request validation near route handlers,
business logic in service modules, and database access in repository-style modules or Prisma-focused
helpers.

## Shared Package

The shared package lives in `packages/shared`. It contains reusable TypeScript types and Zod
schemas, starting with task/user enums and `createProjectSchema`.

Use this package for contracts that both the frontend and backend need. Avoid putting server-only
logic or browser-only code here.

## Database

The database schema lives in `prisma/schema.prisma` and uses PostgreSQL. The initial schema models
users, organizations, memberships, projects, tasks, comments, activity logs, and notifications.

Prisma migrations should be created with `pnpm db:migrate` after the local database is running.

## Deployment Plan

This scaffold does not deploy anything yet. A future deployment plan can split the system into:

- Web app hosted on a Next.js-friendly platform
- API hosted as a Node.js service
- Managed PostgreSQL database
- Environment-specific secrets for production
- CI checks before merges and deployment
