# Database Schema

The initial Prisma schema is intentionally realistic but still small enough to learn from.

## Models

| Model                | Purpose                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `User`               | A person who can authenticate, belong to organizations, report tasks, receive assignments, comment, and get notifications. |
| `Organization`       | A workspace that groups members and projects.                                                                              |
| `OrganizationMember` | Joins users to organizations and stores their role.                                                                        |
| `Project`            | A project inside an organization. Tasks belong to projects.                                                                |
| `Task`               | A work item with status, priority, optional assignee, optional reporter, and optional due date.                            |
| `Comment`            | A message attached to a task.                                                                                              |
| `ActivityLog`        | A lightweight audit trail for project activity.                                                                            |
| `Notification`       | A user-facing notification such as an assignment, mention, or reminder.                                                    |

## Authentication Foundation

The `User` model includes the fields required for first-party email/password authentication:

- `id` as the stable application identifier
- `name` as the required display name collected during signup
- `email` as the required unique login identifier
- `passwordHash` for the hashed password value only
- `createdAt` and `updatedAt` for auditing profile and credential changes

Plain-text passwords should never be stored. Signup and login request validation lives in
`packages/shared` so the frontend and API can reuse the same input contract when auth routes are
implemented.

## Organizations and Membership

`Organization` is the workspace boundary for the platform. Every project (and later every task)
lives inside exactly one organization.

- `name` is required and displayed in the UI.
- `slug` is required and unique. Clients may provide one; otherwise the API generates a unique
  slug from the name.
- `createdAt` and `updatedAt` track changes.

`OrganizationMember` is the join table between `User` and `Organization`. It models a
many-to-many relationship: one user can belong to many organizations, and one organization can
have many users.

- `role` (`UserRole` enum) stores the member's permission level inside that organization. The
  user who creates an organization is automatically its `OWNER`.
- `@@unique([organizationId, userId])` guarantees a user joins each organization at most once and
  lets the API look up a membership with a single indexed query.
- Both foreign keys cascade on delete, so removing a user or organization cleans up memberships.
- `createdAt` doubles as the "joined at" timestamp exposed by the members API.

Authorization is membership-based: every organization-scoped API request resolves the current
user's `OrganizationMember` row first, then checks the `role` against the action's requirements.

## Enums

`UserRole` defines organization permissions:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

`TaskStatus` defines task workflow states:

- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `DONE`
- `CANCELED`

`TaskPriority` defines task urgency:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

`NotificationType` defines the initial notification categories:

- `TASK_ASSIGNED`
- `MENTION`
- `COMMENT_ADDED`
- `DUE_DATE_REMINDER`
- `PROJECT_UPDATED`

## Migration Workflow

Start PostgreSQL first:

```bash
docker compose up -d postgres
```

Then create and apply a migration:

```bash
pnpm db:migrate
```

Prisma will create migration files under `prisma/migrations`. Commit those files with the code
change that introduced the schema update.
