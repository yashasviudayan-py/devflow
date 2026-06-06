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
