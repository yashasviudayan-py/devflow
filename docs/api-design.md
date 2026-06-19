# API Design

The DevFlow API starts as a REST API. It should remain predictable, boring, and easy to test.

## Conventions

- Use JSON for request and response bodies.
- Use plural resource names, such as `/projects` and `/tasks`.
- Use HTTP methods consistently:
  - `GET` for reading data
  - `POST` for creating data
  - `PATCH` for partial updates
  - `DELETE` for deletion
- Validate incoming request bodies with Zod schemas.
- Return stable error shapes from centralized error middleware.
- Keep authentication route work small and use shared auth validation schemas.

## Pagination

All list endpoints use cursor pagination with a single, shared convention so clients can treat
every collection the same way.

- Query parameters (validated by `paginationQuerySchema`): `limit` (optional, default `20`, max
  `100`) and `cursor` (optional, opaque token).
- Response envelope: the resource's named array plus a `nextCursor` field, e.g.
  `{ "projects": [...], "nextCursor": "clx..." }`. `nextCursor` is `null` on the final page.
- The cursor is the id of the last row in the previous page; clients pass it back verbatim to fetch
  the next page. Results are ordered by `createdAt` ascending with an `id` tiebreaker, so paging is
  stable even when rows share a timestamp.
- An invalid `limit` (non-numeric, `0`, negative, or greater than `100`) responds with `400`.

Example: `GET /organizations/:organizationId/projects?limit=2&cursor=clx123` returns up to two
projects after `clx123` and a `nextCursor` for the following page.

## Initial Routes

| Method | Route     | Purpose                    |
| ------ | --------- | -------------------------- |
| GET    | `/health` | Check whether the API runs |

Response:

```json
{
  "status": "ok",
  "service": "devflow-api"
}
```

## Authentication Routes

Phase 1 authentication uses email/password credentials and stores the signed JWT in an HTTP-only
cookie named `devflow_auth`.

| Method | Route          | Purpose                                  |
| ------ | -------------- | ---------------------------------------- |
| POST   | `/auth/signup` | Create a user and start a cookie session |
| POST   | `/auth/login`  | Authenticate and start a cookie session  |
| GET    | `/auth/me`     | Return the current authenticated user    |
| POST   | `/auth/logout` | Clear the auth cookie                    |

`POST /auth/signup` validates request bodies with `signupSchema`:

```json
{
  "name": "Yashasvi Udayan",
  "email": "yashasvi@example.com",
  "password": "password123"
}
```

`POST /auth/login` validates request bodies with `loginSchema`:

```json
{
  "email": "yashasvi@example.com",
  "password": "password123"
}
```

Successful signup, login, and me responses return safe user data only:

```json
{
  "user": {
    "id": "clx...",
    "name": "Yashasvi Udayan",
    "email": "yashasvi@example.com",
    "createdAt": "2026-06-08T00:00:00.000Z"
  }
}
```

`passwordHash` is never returned. Login failures use the same generic `401` message for unknown
emails and wrong passwords:

```json
{
  "error": {
    "message": "Invalid credentials",
    "statusCode": 401
  }
}
```

## Organization Routes

All organization routes require an authenticated user (the `devflow_auth` cookie). Authorization
is enforced per organization through reusable middleware:

- `requireOrganizationMember` loads the current user's membership for `:organizationId` and
  returns `404` when the user is not a member, so non-members cannot probe which organizations
  exist.
- `requireOrganizationRole([...roles])` additionally returns `403` when the user is a member but
  does not hold one of the allowed roles.

| Method | Route                                              | Access         |
| ------ | -------------------------------------------------- | -------------- |
| POST   | `/organizations`                                   | Authenticated  |
| GET    | `/organizations`                                   | Authenticated  |
| GET    | `/organizations/:organizationId`                   | Member         |
| PATCH  | `/organizations/:organizationId`                   | OWNER or ADMIN |
| GET    | `/organizations/:organizationId/members`           | Member         |
| DELETE | `/organizations/:organizationId/members/:memberId` | OWNER          |

`POST /organizations` validates request bodies with `createOrganizationSchema`. `slug` is
optional; when omitted, the API generates a unique slug from the name. The creator automatically
becomes the `OWNER` member. Responds with `201`:

```json
{
  "organization": {
    "id": "clx...",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "createdAt": "2026-06-08T00:00:00.000Z",
    "updatedAt": "2026-06-08T00:00:00.000Z",
    "role": "OWNER"
  }
}
```

A user-provided slug that already exists responds with `409`.

`GET /organizations` returns only organizations the current user belongs to, each including the
user's `role`, as `{ "organizations": [...], "nextCursor": ... }`. It accepts the shared `limit` and
`cursor` pagination parameters.

`GET /organizations/:organizationId` returns `{ "organization": { ..., "role": "..." } }` for
members and `404` for everyone else.

`PATCH /organizations/:organizationId` validates request bodies with `updateOrganizationSchema`
(`name` and/or `slug`; at least one required) and returns the updated organization.

`GET /organizations/:organizationId/members` returns safe member data only — `passwordHash` is
never included. It accepts the shared `limit`/`cursor` pagination parameters and includes
`nextCursor` alongside `members`:

```json
{
  "members": [
    {
      "id": "clx...",
      "role": "OWNER",
      "joinedAt": "2026-06-08T00:00:00.000Z",
      "user": {
        "id": "clx...",
        "name": "Yashasvi Udayan",
        "email": "yashasvi@example.com"
      }
    }
  ]
}
```

`DELETE /organizations/:organizationId/members/:memberId` removes a membership (`memberId` is the
`OrganizationMember` id). Only an `OWNER` may remove members, and removing the only `OWNER` of an
organization is rejected with `400`. Responds with `{ "success": true }`.

## Project Routes

Projects live inside organizations, so authorization is derived entirely from the caller's
membership in the owning organization — there is no separate project membership. All project
routes require an authenticated user.

| Method | Route                                     | Access               |
| ------ | ----------------------------------------- | -------------------- |
| POST   | `/organizations/:organizationId/projects` | OWNER, ADMIN, MEMBER |
| GET    | `/organizations/:organizationId/projects` | Member (any role)    |
| GET    | `/projects/:projectId`                    | Member of owning org |
| PATCH  | `/projects/:projectId`                    | OWNER or ADMIN       |
| DELETE | `/projects/:projectId`                    | OWNER or ADMIN       |

The create and list routes are nested under the organization, so the existing
`requireOrganizationMember` / `requireOrganizationRole` middleware applies directly. The
`/projects/:projectId` routes resolve the owning organization from the project, then run the same
membership/role checks through `requireProjectOrganizationMember` /
`requireProjectOrganizationRole`. When the project does not exist **or** the caller is not a member
of its organization, the API responds with `404` so it never leaks the existence of inaccessible
projects.

`VIEWER` is a read-only role: viewers can list and read projects but cannot create them. Creating a
project requires an active role (`OWNER`, `ADMIN`, or `MEMBER`). Updating, archiving, and deleting
are restricted to `OWNER` and `ADMIN`, mirroring organization management.

`POST /organizations/:organizationId/projects` validates request bodies with `createProjectSchema`
(`name` required, `description` optional). The authenticated user is recorded as `createdById`.
Responds with `201`:

```json
{
  "project": {
    "id": "clx...",
    "organizationId": "clx...",
    "createdById": "clx...",
    "name": "Website redesign",
    "description": "Refresh the public marketing site.",
    "archivedAt": null,
    "createdAt": "2026-06-08T00:00:00.000Z",
    "updatedAt": "2026-06-08T00:00:00.000Z"
  }
}
```

`GET /organizations/:organizationId/projects` returns `{ "projects": [...], "nextCursor": ... }` for
members and accepts the shared `limit`/`cursor` pagination parameters. Archived projects are excluded
by default.

`GET /projects/:projectId` returns `{ "project": { ... } }` for members of the owning organization.

`PATCH /projects/:projectId` validates request bodies with `updateProjectSchema` (`name`,
`description`, and/or `archived`; at least one required) and returns the updated project. Sending
`{ "archived": true }` soft-archives the project; `{ "archived": false }` restores it.

`DELETE /projects/:projectId` soft-archives the project (sets `archivedAt`) rather than hard-deleting
it, so the project and its future tasks remain recoverable. Responds with `{ "success": true }`.

## Task Routes

Tasks live inside projects, which live inside organizations. Authorization is derived entirely from
the caller's membership in the organization that owns the task's project — there is no separate task
or project membership. All task routes require an authenticated user.

| Method | Route                        | Access               |
| ------ | ---------------------------- | -------------------- |
| POST   | `/projects/:projectId/tasks` | OWNER, ADMIN, MEMBER |
| GET    | `/projects/:projectId/tasks` | Member (any role)    |
| GET    | `/tasks/:taskId`             | Member of owning org |
| PATCH  | `/tasks/:taskId`             | OWNER, ADMIN, MEMBER |
| DELETE | `/tasks/:taskId`             | OWNER, ADMIN, MEMBER |

The create and list routes are nested under the project, so the existing
`requireProjectOrganizationMember` / `requireProjectOrganizationRole` middleware applies directly.
The `/tasks/:taskId` routes resolve the owning organization from the task (task → project →
organization), then run the same membership/role checks through `requireTaskOrganizationMember` /
`requireTaskOrganizationRole`. When the task does not exist **or** the caller is not a member of its
organization, the API responds with `404` so it never leaks the existence of inaccessible tasks.

`VIEWER` is a read-only role: viewers can list and read tasks but cannot create, update, or archive
them. Those write actions require an active role (`OWNER`, `ADMIN`, or `MEMBER`), mirroring the
project model. Tasks are day-to-day work items, so any active member can manage them.

`POST /projects/:projectId/tasks` validates request bodies with `createTaskSchema` (`title`
required; `description`, `status`, `priority`, `assigneeId`, and `dueDate` optional). The
authenticated user is recorded as the task `reporter` (creator). When `assigneeId` is provided, it
must belong to the same organization, otherwise the API responds with `400`. Responds with `201`:

```json
{
  "task": {
    "id": "clx...",
    "projectId": "clx...",
    "reporterId": "clx...",
    "assigneeId": null,
    "title": "Ship the tasks API",
    "description": "Implement CRUD endpoints.",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": null,
    "archivedAt": null,
    "createdAt": "2026-06-15T00:00:00.000Z",
    "updatedAt": "2026-06-15T00:00:00.000Z",
    "assignee": null,
    "reporter": { "id": "clx...", "name": "Yashasvi Udayan", "email": "yashasvi@example.com" }
  }
}
```

Nested `assignee` and `reporter` objects expose only `id`, `name`, and `email`. `passwordHash` is
never returned.

`GET /projects/:projectId/tasks` returns `{ "tasks": [...], "nextCursor": ... }` for members and
accepts the shared `limit`/`cursor` pagination parameters. Archived tasks are excluded by default.
Optional query filters (validated with `taskFilterSchema`) narrow the results:

- `status` — one of `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELED`
- `priority` — one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `assigneeId` — tasks assigned to a specific user

Example: `GET /projects/:projectId/tasks?status=IN_PROGRESS&priority=HIGH`. An invalid filter value
responds with `400`.

`GET /tasks/:taskId` returns `{ "task": { ... } }` for members of the owning organization.

`PATCH /tasks/:taskId` validates request bodies with `updateTaskSchema` (`title`, `description`,
`status`, `priority`, `assigneeId`, `dueDate`, and/or `archived`; at least one required). Sending
`assigneeId: null` unassigns the task and `dueDate: null` clears the due date; a non-null
`assigneeId` must belong to the organization. Sending `{ "archived": false }` restores an archived
task. Returns the updated task.

`DELETE /tasks/:taskId` soft-archives the task (sets `archivedAt`) rather than hard-deleting it, so
the task and its comments remain recoverable. Responds with `{ "success": true }`.

## Comment Routes

Comments belong to tasks, which belong to projects, which belong to organizations. Authorization is
derived entirely from the caller's membership in the organization that owns the comment's task
(comment → task → project → organization) — there is no separate comment membership. All comment
routes require an authenticated user.

| Method | Route                        | Access                          |
| ------ | ---------------------------- | ------------------------------- |
| POST   | `/tasks/:taskId/comments`    | OWNER, ADMIN, MEMBER            |
| GET    | `/tasks/:taskId/comments`    | Member (any role)               |
| PATCH  | `/comments/:commentId`       | Comment author                  |
| DELETE | `/comments/:commentId`       | Comment author, or OWNER/ADMIN  |

The create and list routes are nested under the task, so the existing
`requireTaskOrganizationMember` / `requireTaskOrganizationRole` middleware applies directly. The
`/comments/:commentId` routes resolve the owning organization from the comment, then check
membership through `requireCommentOrganizationMember`. When the comment does not exist **or** the
caller is not a member of its organization, the API responds with `404` so it never leaks the
existence of inaccessible comments.

Commenting is a write action, so posting requires an active role (`OWNER`, `ADMIN`, or `MEMBER`),
mirroring task creation. `VIEWER` is read-only: viewers can read comments but cannot post them.

Ownership rules layer on top of membership:

- **Editing** a comment is restricted to its author. OWNER/ADMIN cannot edit other members'
  comments — rewriting someone else's words is different from moderating them. A non-author member
  receives `403`.
- **Deleting** a comment is allowed for its author, and additionally for `OWNER`/`ADMIN` as
  moderators of any comment in their organization. A non-author, non-moderator member receives
  `403`.

`POST /tasks/:taskId/comments` validates request bodies with `createCommentSchema` (`body`
required, 1–5000 characters). The authenticated user is recorded as the `author`. Responds with
`201`:

```json
{
  "comment": {
    "id": "clx...",
    "taskId": "clx...",
    "authorId": "clx...",
    "body": "Looks good to me — shipping it.",
    "createdAt": "2026-06-18T00:00:00.000Z",
    "updatedAt": "2026-06-18T00:00:00.000Z",
    "author": { "id": "clx...", "name": "Yashasvi Udayan", "email": "yashasvi@example.com" }
  }
}
```

The nested `author` object exposes only `id`, `name`, and `email`. `passwordHash` is never
returned. (`authorId` and `author` may be `null` if the author's account was later removed, since
the relation uses `onDelete: SetNull`.)

`GET /tasks/:taskId/comments` returns `{ "comments": [...] }` for members, sorted by `createdAt`
ascending (with an `id` tiebreaker) so the conversation reads top to bottom.

`PATCH /comments/:commentId` validates request bodies with `updateCommentSchema` (`body` required)
and returns the updated comment.

`DELETE /comments/:commentId` hard-deletes the comment and responds with `{ "success": true }`.
Unlike tasks and projects, comments have no soft-delete column, so deletion is permanent. (Deleting
a task cascades to its comments.)

## Activity Log Routes

Activity logs are a lightweight, server-written audit trail. Important project, task,
and comment actions are recorded automatically by the API — **there is no endpoint for
clients to create activity logs**, and the recorded events do not accept user-supplied
fields. Two read-only feeds expose the trail.

| Method | Route                            | Access            |
| ------ | -------------------------------- | ----------------- |
| GET    | `/tasks/:taskId/activity`        | Member (any role) |
| GET    | `/projects/:projectId/activity`  | Member (any role) |

Both routes are nested under their parent resource and reuse the existing access
middleware, so authorization is identical to reading the task or project itself:

- `GET /tasks/:taskId/activity` runs `requireTaskOrganizationMember` (task → project →
  organization). A non-member — or a request for a non-existent task — gets `404`, so the
  feed never leaks the existence of, or activity from, organizations the caller does not
  belong to.
- `GET /projects/:projectId/activity` runs `requireProjectOrganizationMember` (project →
  organization) with the same `404` behaviour.

Reading activity is a read action, so any member (including `VIEWER`) may view it.
Unauthenticated requests get `401`. An invalid pagination `limit` gets `400`.

Each event is stamped with the `projectId` and (for task/comment events) `taskId` it
relates to, so the **task feed** returns that task's events plus the comments on it, and
the **project feed** returns everything under the project (project, task, and comment
events) with a single indexed query. Results are sorted **newest first** (`createdAt`
descending) and use the shared `limit`/`cursor` pagination convention (default `20`):

```json
{
  "activity": [
    {
      "id": "clx...",
      "organizationId": "clx...",
      "projectId": "clx...",
      "taskId": "clx...",
      "actorId": "clx...",
      "action": "TASK_STATUS_CHANGED",
      "entityType": "TASK",
      "entityId": "clx...",
      "metadata": { "from": "TODO", "to": "IN_PROGRESS" },
      "createdAt": "2026-06-19T00:00:00.000Z",
      "actor": { "id": "clx...", "name": "Yashasvi Udayan", "email": "yashasvi@example.com" }
    }
  ],
  "nextCursor": null
}
```

The nested `actor` object exposes only `id`, `name`, and `email`; `passwordHash` is never
returned. `actorId`/`actor` may be `null` if the actor's account was later removed (the
relation uses `onDelete: SetNull`).

### Recorded actions and metadata

`action` is one of the `ActivityAction` values and `entityType` is one of `PROJECT`,
`TASK`, or `COMMENT`. `entityId` is the id of the affected entity (for `COMMENT_DELETED`
it is the now-deleted comment's id, stored as a plain string so the log survives the
delete). `metadata` is a small JSON object whose shape depends on the action — it stores
useful old/new values only, and never sensitive data:

| Action                  | When                                | Example metadata                                  |
| ----------------------- | ----------------------------------- | ------------------------------------------------- |
| `PROJECT_CREATED`       | Project created                     | `{ "name": "Website redesign" }`                  |
| `PROJECT_UPDATED`       | Project patched                     | `{ "changes": { "name": { "from": "A", "to": "B" } } }` |
| `PROJECT_ARCHIVED`      | Project archived (DELETE)           | `{ "name": "Website redesign" }`                  |
| `TASK_CREATED`          | Task created                        | `{ "title": "...", "status": "TODO", "priority": "MEDIUM" }` |
| `TASK_UPDATED`          | Title/description/due date edited   | `{ "changes": { "title": { "from": "A", "to": "B" }, "description": { "changed": true } } }` |
| `TASK_STATUS_CHANGED`   | Status changed                      | `{ "from": "TODO", "to": "IN_PROGRESS" }`         |
| `TASK_PRIORITY_CHANGED` | Priority changed                    | `{ "from": "MEDIUM", "to": "HIGH" }`              |
| `TASK_ASSIGNED`         | Assignee set/changed                | `{ "from": null, "to": "clxUser..." }`            |
| `TASK_UNASSIGNED`       | Assignee cleared                    | `{ "from": "clxUser..." }`                        |
| `TASK_ARCHIVED`         | Task archived (DELETE or PATCH)     | `{ "title": "..." }`                              |
| `COMMENT_CREATED`       | Comment posted                      | _none_                                            |
| `COMMENT_UPDATED`       | Comment edited                      | _none_                                            |
| `COMMENT_DELETED`       | Comment deleted                     | _none_                                            |

A single `PATCH /tasks/:taskId` can record several events at once (for example a status
change and a priority change), each with its own metadata. Task descriptions can be long,
so a description edit records only `{ "changed": true }` rather than both full bodies.

Recording is **best-effort**: it happens after the user action has already succeeded, and
a failed audit write is logged server-side and swallowed so it never turns a successful
mutation into an error for the user.

## Future Route Ideas

| Method | Route                              | Purpose                          |
| ------ | ---------------------------------- | -------------------------------- |
| POST   | `/tasks/:taskId/comments/:id/...`  | Threaded replies / reactions     |
