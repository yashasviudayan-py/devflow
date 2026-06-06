# Git Workflow

DevFlow uses a simple branch workflow designed for learning professional habits.

## Branches

- `main` contains stable code.
- `develop` is the integration branch for upcoming work.
- `feature/*` branches contain small focused changes.

Example:

```bash
git checkout develop
git checkout -b feature/project-list
```

## Pull Requests

Open a pull request when a feature branch is ready. A good pull request should:

- Explain what changed
- Include screenshots for UI changes when useful
- Mention any database migration
- Pass typecheck, lint, tests, and build
- Stay small enough to review carefully

## Commit Messages

Use short, clear commit messages:

```bash
git commit -m "feat: add project list page"
git commit -m "fix: handle missing task assignee"
git commit -m "chore: initialize devflow monorepo"
```

Common prefixes:

- `feat` for new user-facing behavior
- `fix` for bug fixes
- `chore` for maintenance
- `docs` for documentation
- `test` for tests
- `refactor` for code structure changes without behavior changes

## Merge Conflict Prevention

- Pull the latest `develop` before starting work.
- Keep branches short-lived.
- Avoid editing many unrelated files in one branch.
- Split large features into smaller pull requests.
- Communicate before changing shared configuration files.
