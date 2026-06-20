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

`NEXT_PUBLIC_API_URL` tells the web app where the API runs. The web app falls back to
`http://localhost:4000`, so the default setup works without extra configuration. Note that
Next.js only loads env files from `apps/web`, so to override the API URL create
`apps/web/.env.local` with the `NEXT_PUBLIC_API_URL` value.

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

## Authentication in the Web App

The frontend auth pages live at:

- `http://localhost:3000/signup` — create an account
- `http://localhost:3000/login` — log in
- `http://localhost:3000/dashboard` — authenticated user info and logout

The API stores the session JWT in an HTTP-only cookie, so the browser (not JavaScript) holds
the credential. Every frontend API call uses `credentials: "include"` so the cookie is sent
between `localhost:3000` and `localhost:4000`. The API's CORS config already allows the web
origin (`WEB_URL`) with credentials, so no extra setup is needed locally. Authenticated pages
check `GET /auth/me` on load and redirect to `/login` when the session is missing or expired.

## Organizations in the Web App

The organization pages live at:

- `http://localhost:3000/dashboard` — lists your organizations (with an empty state and a
  create link when you have none) and lets you pick the active organization
- `http://localhost:3000/organizations/new` — create an organization (slug is optional; the
  API generates one from the name when left blank)
- `http://localhost:3000/organizations/<id>` — organization details and member list

The active organization is only a UI preference, so its id is kept in `localStorage` under
`devflow.activeOrganizationId`. This is safe because authorization is always enforced by the
API per request via the HTTP-only cookie; auth tokens are never stored in `localStorage`. If
the stored organization disappears, the dashboard falls back to your first organization.

To test manually: sign up or log in, open `/dashboard`, create an organization, confirm it
appears with the **Active** badge, then open it to see yourself listed as `OWNER`.

## Projects in the Web App

The project pages live at:

- `http://localhost:3000/organizations/<id>` — the organization detail page now lists the
  organization's projects (with an empty state) alongside its members
- `http://localhost:3000/organizations/<id>/projects/new` — create a project (name required,
  description optional); on success it redirects to the new project's detail page
- `http://localhost:3000/projects/<id>` — project details, including the owning organization,
  created/updated timestamps, and the project's tasks (with filters and an empty state)

Project authorization is derived from the caller's organization role. The project endpoints
do not return the role, so the detail page loads the owning organization to learn it. `OWNER`
and `ADMIN` see **Edit** and **Archive** controls; `VIEWER` cannot create projects. Archiving
soft-archives the project (the API sets `archivedAt`) and redirects back to the organization.

To test manually: open an organization, confirm the empty project state, create a project,
confirm the redirect to its detail page, return to the organization, and confirm it appears
in the project list.

## Tasks in the Web App

The task pages live at:

- `http://localhost:3000/projects/<id>` — the project detail page lists the project's tasks
  (with an empty state) and offers status / priority / assignee filters
- `http://localhost:3000/projects/<id>/tasks/new` — create a task (title required; description,
  status, priority, assignee, and due date optional); on success it redirects to the new task's
  detail page
- `http://localhost:3000/tasks/<id>` — task details (status, priority, assignee, creator, due
  date, timestamps), an inline edit form, an **Archive** control, and the task's comments

Task authorization is derived from the caller's organization role, resolved through the owning
project (task → project → organization). `OWNER`, `ADMIN`, and `MEMBER` may create, edit, and
archive tasks; `VIEWER` is read-only. The assignee dropdown is populated from the organization's
members; "Unassigned" is allowed. Archiving soft-archives the task (the API sets `archivedAt`) and
redirects back to the project. Inaccessible or missing tasks return `404`, shown as a clean
not-found message.

To test manually: open a project, confirm the empty task state, create a task, confirm the
redirect to its detail page, return to the project, confirm the task appears in the list, then
edit its fields and archive it.

## Kanban Board in the Web App

The board lives at:

- `http://localhost:3000/projects/<id>/board` — project tasks grouped into four columns (**Todo**,
  **In Progress**, **In Review**, **Done**), each showing a task count, cards, and an empty state.
  Reachable via the **Board view** link in the project page's Tasks section.

Each card shows the title (linking to `/tasks/<id>`), priority, assignee, and due date. Members
move a task with the per-card status dropdown, which calls `PATCH /tasks/<id>` with the new
status. The board shows the first page of tasks (the list endpoint is paginated, default 20),
matching the project task list. Tasks with the `CANCELED` status have no column and are not shown.

Moves are optimistic: the card jumps to its new column immediately, then reconciles with the API
response. If the request fails the card rolls back to its previous column and a friendly error is
shown — `401` redirects to `/login`, `403` shows a permission error, `404` asks the user to
refresh. `OWNER`, `ADMIN`, and `MEMBER` may move tasks; `VIEWER` sees a read-only board.

To test manually: open a project with tasks in different statuses, open **Board view**, confirm
tasks land in the correct columns, move a task between columns, refresh to confirm the change
persisted, and open a card to reach its detail page.

## Comments in the Web App

The task detail page (`http://localhost:3000/tasks/<id>`) has a **Comments** section below the
task details. It fetches `GET /tasks/<id>/comments` and renders comments oldest-first, each card
showing the author's name and email, the timestamp, the body, and an `edited` marker when the
comment has been updated. The section handles loading, empty, and error states cleanly.

A comment form lets active members (`OWNER`, `ADMIN`, `MEMBER`) post a comment via
`POST /tasks/<id>/comments`; the textarea is validated with the shared `createCommentSchema` and
clears on success, appending the new comment to the list. `VIEWER` sees the conversation but a
read-only notice instead of the form.

Comment authorization mirrors the API: **Edit** (inline, validated with `updateCommentSchema`) is
shown only to a comment's author, while **Delete** (with a browser confirm) is shown to the author
and to `OWNER`/`ADMIN` moderators. Failed actions show a friendly message — `403` is a permission
error and `404` means the comment is gone.

To test manually: open a task, confirm the empty state, post a comment, confirm it appears and
survives a refresh, edit your own comment (note the `edited` marker), then delete it.

## Activity Logs in the Web App

Both the task and project detail pages have an **Activity** section that shows a server-written
audit trail, newest-first:

- `http://localhost:3000/tasks/<id>` — fetches `GET /tasks/<id>/activity` (the task's own events
  plus comments on it)
- `http://localhost:3000/projects/<id>` — fetches `GET /projects/<id>/activity` (project, task,
  and comment events under the project)

Each row shows the actor's name, a readable summary of what happened, and a timestamp — for
example "Yashasvi moved this task from To do to In progress" or "Yashasvi assigned this task to
Alex". Enum values are converted to the same labels used elsewhere in the UI, and assignment
events resolve the assignee id to a name via the organization's member list (falling back to "a
member" when unknown). The wording adapts to context ("this task" on a task page, "a task" in the
project feed). The section handles loading, empty, and error states, and unknown actions or
missing metadata degrade gracefully rather than breaking the timeline.

Activity is read-only and there is no create UI — the API records events automatically. Access
uses the same membership check as the page itself, so a member who can open the page can load its
activity; non-members never reach the page (they get the `404` not-found screen), and
unauthenticated users are redirected to `/login`.

To test manually: open a task, change its status and priority, add and edit a comment, then
confirm those actions appear in the task's Activity section; open the project and confirm the
project Activity section shows the project and task events with actor names and timestamps.

## Notifications in the Web App

Notifications tell you about events that concern you — a task assigned to you, a status/priority
change on a task you own, or a new comment on a task you are involved in. They are created
automatically by the API; there is no create UI.

- The **dashboard** header (`http://localhost:3000/dashboard`) shows a **Notifications** bell that
  fetches `GET /notifications/unread-count` on load and shows a small badge when you have unread
  notifications. Clicking it opens the notifications page.
- `http://localhost:3000/notifications` lists your notifications newest-first (`GET
  /notifications`). Each row shows the actor, a title/message, a timestamp, an unread indicator,
  and — when the notification has enough metadata — a **View** link to the related task, project,
  or organization. The page handles loading, empty, and error states.
- **Mark read** marks a single notification read (`PATCH /notifications/<id>/read`); **Mark all as
  read** clears them all (`PATCH /notifications/read-all`); **Delete** removes one (`DELETE
  /notifications/<id>`, after a confirm). The unread summary updates locally after each action
  without a refetch.

You only ever see your own notifications: every endpoint is scoped to the signed-in user, and the
page reuses the app-wide auth guard, so unauthenticated users are redirected to `/login`.

To test manually with two accounts (e.g. an owner and a member of the same organization): as the
owner, assign a task to the member and comment on it; then sign in as the member and confirm the
bell shows an unread count, the `/notifications` page lists those notifications, the **View** link
opens the task, **Mark read** lowers the count, **Mark all as read** zeroes it, and **Delete**
removes a notification.

> **Note:** the unread count is fetched on page load and refreshed after actions on the
> notifications page — it does not live-update via polling or websockets yet (deferred to a future
> PR). Reload the dashboard to refresh the bell after reading notifications elsewhere.

## Quality Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### Tests and the database

The API route tests are integration tests: they run real SQL through Prisma against a migrated
schema instead of an in-memory mock. Start Postgres first (`docker compose up -d postgres`) so
`pnpm test` can connect.

The suite isolates itself from your dev data by using a dedicated `test` schema in the same
`devflow` database (`...:5432/devflow?schema=test`). A global setup applies migrations to that schema
once, and every test truncates only the `test` schema between runs — data in `public` is never
touched. To point the tests at a different database (for example in CI), set `TEST_DATABASE_URL`.
