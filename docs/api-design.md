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
