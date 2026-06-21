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
| `ActivityLog`        | A lightweight, server-written audit trail for project, task, and comment activity.                                         |
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

## Projects

`Project` is a unit of work inside an organization. Every project belongs to exactly one
organization, and an organization has many projects (`Organization.projects`).

- `organizationId` is the required owning organization. The foreign key cascades on delete, so
  deleting an organization removes its projects.
- `createdById` records the user who created the project. It is optional and uses `onDelete:
SetNull`, so a project survives (and keeps its history) even if its creator's account is later
  removed. The reverse relation is `User.createdProjects`.
- `name` is required; `description` is optional.
- `archivedAt` enables soft-archiving. The delete endpoint sets this timestamp instead of removing
  the row, and listings exclude archived projects by default, which keeps a project's future tasks
  and activity recoverable.
- `@@index([organizationId])` keeps per-organization listings fast, and `@@index([createdById])`
  supports "projects I created" style lookups. The project list endpoint searches on `name`/
  `description` and sorts on `name`, `createdAt`, or `updatedAt`; like tasks, these run over the
  already-`organizationId`-scoped set, so no extra index was added (and `ILIKE` search would need a
  `pg_trgm` index rather than a B-tree if it ever needs to scale).

Projects do not have their own membership model. Authorization reuses `OrganizationMember`: a
caller's access to a project is determined by their role in the organization that owns it. This
keeps the permission model simple and consistent, and the same approach will extend to tasks, which
are scoped to projects.

## Tasks

`Task` is a work item inside a project. Every task belongs to exactly one project, and a project has
many tasks (`Project.tasks`).

- `projectId` is the required owning project. The foreign key cascades on delete, so deleting (or
  hard-removing) a project removes its tasks.
- `reporterId` records the user who created the task (relation `User.reportedTasks`,
  `Task.reporter`). It is optional and uses `onDelete: SetNull`, so a task survives even if its
  creator's account is later removed. DevFlow models the task's creator as its "reporter"; the
  Tasks API sets this to the authenticated user on creation.
- `assigneeId` is the optional user the task is assigned to (relation `User.assignedTasks`,
  `Task.assignee`), also `onDelete: SetNull`. The API verifies an assignee belongs to the task's
  organization before saving, so tasks can never be assigned to outsiders.
- `title` is required; `description` is optional.
- `status` (`TaskStatus`) and `priority` (`TaskPriority`) default to `TODO` and `MEDIUM`.
- `dueDate` is optional.
- `archivedAt` enables soft-archiving, matching the `Project` pattern. The delete endpoint sets this
  timestamp instead of removing the row, and listings exclude archived tasks by default, keeping a
  task (and its comments) recoverable.
- `@@index([projectId, status])` keeps per-project, status-filtered listings fast;
  `@@index([assigneeId])` and `@@index([reporterId])` support "assigned to me" / "reported by me"
  lookups.

### Fields used for filtering and sorting

The task list endpoint (`GET /projects/:projectId/tasks`) filters on `status`, `priority`,
`assigneeId` (and `assigneeId IS NULL` for `unassigned`), and a `dueDate` range, and sorts on
`title`, `status`, `priority`, `dueDate`, `createdAt`, or `updatedAt`.

No new indexes were added for these, deliberately:

- Every task query is **already scoped to a single `projectId`**, so the leading column of
  `@@index([projectId, status])` narrows to one project's tasks before any other predicate runs. The
  remaining filtering/sorting happens over that small per-project set, where extra single-column
  indexes (on `priority`, `dueDate`, …) would add write cost for little read benefit.
- `q` search uses case-insensitive `contains` (`ILIKE '%term%'`), which a B-tree index cannot serve.
  If search ever needs to scale, the right tool is a PostgreSQL `pg_trgm` GIN index (or a dedicated
  search engine) — intentionally out of scope here.

If a future numbered-page UI or cross-project task views arrive, revisit a composite such as
`@@index([projectId, dueDate])` for due-date-sorted listings. Authorization reuses
`OrganizationMember`: a caller's access to a task is determined by their role in the organization
that owns the task's project (task → project → organization).

## Comments

`Comment` is a message attached to a task. Every comment belongs to exactly one task, and a task has
many comments (`Task.comments`).

- `taskId` is the required owning task. The foreign key cascades on delete, so deleting (or
  hard-removing) a task removes its comments.
- `authorId` records the user who wrote the comment (relation `User.comments`, `Comment.author`). It
  is optional and uses `onDelete: SetNull`, so a comment survives — preserving the discussion — even
  if its author's account is later removed. The API sets this to the authenticated user on creation
  and uses it for the author-only edit check.
- `body` is the required comment text (1–5000 characters, validated in `packages/shared`).
- `createdAt` orders the conversation; the list endpoint sorts by it ascending. `updatedAt` reflects
  edits.
- `@@index([taskId])` keeps per-task comment listings fast, and `@@index([authorId])` supports
  "comments by user" lookups.

Comments have **no soft-delete column** (no `archivedAt`/`deletedAt`), unlike `Project` and `Task`.
Deletion is therefore a hard delete: authors can remove their own comments and OWNER/ADMIN can
moderate any comment, both permanently. Because the `taskId` foreign key cascades, archiving is
handled one level up — a task's comments travel with it.

Like projects and tasks, comments have no membership model of their own. Authorization reuses
`OrganizationMember`: a caller's access to a comment is determined by their role in the organization
that owns the comment's task (comment → task → project → organization).

## Activity Logs

`ActivityLog` is a lightweight audit trail. It is written **only by the server** (there is
no client-facing create endpoint and no user-supplied fields), and it is a simple append
log — not an event-sourcing system that the application's state is rebuilt from.

- `organizationId` is the required owning organization and the authoritative scoping field.
  The foreign key cascades on delete. `@@index([organizationId])` keeps per-org lookups fast.
- `projectId` is optional (`onDelete: Cascade`). Every event currently recorded belongs to a
  project, but the column is nullable so future org-level events can be logged without one.
- `taskId` is optional (`onDelete: Cascade`). It is set on task events **and on comment
  events** (a comment's task), so a task's full timeline — its own changes plus its
  comments — is a single indexed `where: { taskId }` lookup. Because every event also carries
  `projectId`, a project's whole timeline is a single `where: { projectId }` lookup.
- `actorId` records the user who performed the action (relation `User.activityLogs`). It is
  optional and uses `onDelete: SetNull`, so history survives a user's removal. Reads expose
  the actor with safe fields only (`id`, `name`, `email`); `passwordHash` is never selected.
- `action` (`ActivityAction`) and `entityType` (`ActivityEntityType`) classify the event.
- `entityId` is the affected entity's id, stored as a **plain string, not a foreign key**.
  This is deliberate: comments are hard-deleted, and a `COMMENT_DELETED` log must outlive the
  comment row, so `entityId` must not cascade away with it.
- `metadata` (`Json?`) stores small, non-sensitive old/new values describing the change.
- `createdAt` orders the trail; feeds sort by it descending (newest first).
- `@@index([projectId])`, `@@index([taskId])`, and `@@index([entityType, entityId])` back
  the feed queries and entity lookups.

Like the rest of the platform, activity logs have no membership model of their own.
Authorization for reading them reuses `OrganizationMember`, derived from the owning task or
project, so a user can only see activity for resources they can already access.

## Notifications

`Notification` tells a single user about an event that concerns them. Like activity logs,
notifications are written **only by the server** (there is no client-facing create endpoint
and no user-supplied fields), but unlike every other resource they have **no organization
membership model**: each notification belongs to exactly one recipient, so authorization is
simply ownership.

- `userId` is the required recipient and the authoritative scoping field (relation
  `User.notifications`, `onDelete: Cascade`). Every read and mutation is scoped by it, so a
  user can only ever touch their own notifications. `@@index([userId, readAt])` backs both the
  "my notifications" list and the unread-count query.
- `actorId` is the user who triggered the notification — who assigned the task, changed it, or
  left the comment (relation `User.triggeredNotifications`). It is optional and uses
  `onDelete: SetNull`, so a notification survives the actor's removal. Reads expose the actor
  with safe fields only (`id`, `name`, `email`); `passwordHash` is never selected.
- `type` (`NotificationType`) classifies the event; `title` and `message` are the rendered,
  human-readable text.
- `readAt` (`DateTime?`) is the unread/read flag: `null` means unread. Marking read stamps it;
  the unread count is `where: { userId, readAt: null }`.
- `data` (`Json?`) holds small, non-sensitive context for deep-linking and display
  (`taskId`, `projectId`, `organizationId`, and any `from`/`to` or `commentId`). Cross-entity
  references (task/project/comment) are stored here rather than as dedicated foreign-key
  columns, keeping the model small; the only relation added beyond the recipient is `actor`,
  which is needed to return safe actor data on reads.
- `createdAt` orders the feed (newest first); `updatedAt` tracks read-state changes.

Notifications are hard-deleted (there is no soft-delete column), mirroring comments. Recipients
are always organization members, because assignees are validated against the organization on
assignment and reporters created the task — so a notification never reaches a user outside the
organization.

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

`NotificationType` defines the notification categories. The first four are emitted today; the
rest exist for future use (mentions, due-date reminders, project updates):

- `TASK_ASSIGNED`
- `TASK_STATUS_CHANGED`
- `TASK_PRIORITY_CHANGED`
- `COMMENT_ADDED`
- `MENTION`
- `DUE_DATE_REMINDER`
- `PROJECT_UPDATED`

`ActivityAction` defines the recorded audit events:

- `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_ARCHIVED`
- `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED`, `TASK_PRIORITY_CHANGED`,
  `TASK_ASSIGNED`, `TASK_UNASSIGNED`, `TASK_ARCHIVED`
- `COMMENT_CREATED`, `COMMENT_UPDATED`, `COMMENT_DELETED`

`ActivityEntityType` defines what an activity log points at:

- `PROJECT`
- `TASK`
- `COMMENT`

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
