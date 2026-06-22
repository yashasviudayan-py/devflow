# AGENTS.md

Guidance for Codex, Claude Code, and other coding agents working in this repository.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`

## Coding Rules

- Keep changes small and PR-sized.
- Do not create huge features in one step.
- Prefer clear TypeScript types and shared validation schemas.
- Keep app code simple until the product requirements are explicit.
- Add or update tests when behavior changes.
- Explain complex changes before implementing them.
- Do not add authentication, billing, or deployment complexity until requested.

## Error Handling, Logging & Security Rules (API)

- **Use `AppError` (aliased `HttpError`) for every expected failure** — `new AppError(message,
statusCode)`. The status maps to a stable `code` automatically; pass `{ code, details }` to override.
  Do not hand-build error response objects; the centralized error middleware owns the shape.
- **Follow the standard error shape**: `{ error: { code, message, statusCode, details?, requestId? } }`
  (documented in `docs/api-design.md`). Validation errors are HTTP `400` / `VALIDATION_ERROR` with
  field-level `details`.
- **Let validation and async errors propagate.** Wrap controller handlers in `asyncHandler` instead of
  per-handler `try/catch`; throw from helpers and let the error middleware format the response. Do not
  swallow Zod errors into a generic message — the middleware turns them into `details`.
- **Never return `passwordHash`** (or other sensitive user fields). Select through the existing
  `safeUserSelect`/safe selects; nested user objects expose only `id`, `name`, `email`.
- **Never log secrets.** Do not log request bodies, cookies, `Authorization` headers, JWTs, passwords,
  or password hashes. Use the shared `logger`; it redacts known-sensitive keys.
- **Never leak internals in production.** Unexpected errors must respond with the masked
  `"Internal server error"`; stack traces are development-only.
- **Validate new env vars** in `config/env.ts` (fail fast at startup) and add them to `.env.example`.
- **Add tests for new error paths**: assert the status, the `code`, and (for validation) `details`,
  following `routes/error-handling.routes.test.ts` and `middleware/error.middleware.test.ts`.
