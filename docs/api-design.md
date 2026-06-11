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
user's `role`, as `{ "organizations": [...] }`.

`GET /organizations/:organizationId` returns `{ "organization": { ..., "role": "..." } }` for
members and `404` for everyone else.

`PATCH /organizations/:organizationId` validates request bodies with `updateOrganizationSchema`
(`name` and/or `slug`; at least one required) and returns the updated organization.

`GET /organizations/:organizationId/members` returns safe member data only — `passwordHash` is
never included:

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

## Future Route Ideas

| Method | Route                     | Purpose                 |
| ------ | ------------------------- | ----------------------- |
| GET    | `/projects`               | List projects           |
| POST   | `/projects`               | Create a project        |
| GET    | `/projects/:projectId`    | Read one project        |
| PATCH  | `/projects/:projectId`    | Update one project      |
| GET    | `/tasks`                  | List tasks              |
| POST   | `/tasks`                  | Create a task           |
| PATCH  | `/tasks/:taskId`          | Update one task         |
| POST   | `/tasks/:taskId/comments` | Add a comment to a task |
