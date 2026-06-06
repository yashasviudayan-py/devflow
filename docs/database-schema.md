# Database Schema

The initial Prisma schema is intentionally realistic but still small enough to learn from.

## Models

| Model                | Purpose                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `User`               | A person who can belong to organizations, report tasks, receive assignments, comment, and get notifications. |
| `Organization`       | A workspace that groups members and projects.                                                                |
| `OrganizationMember` | Joins users to organizations and stores their role.                                                          |
| `Project`            | A project inside an organization. Tasks belong to projects.                                                  |
| `Task`               | A work item with status, priority, optional assignee, optional reporter, and optional due date.              |
| `Comment`            | A message attached to a task.                                                                                |
| `ActivityLog`        | A lightweight audit trail for project activity.                                                              |
| `Notification`       | A user-facing notification such as an assignment, mention, or reminder.                                      |

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
