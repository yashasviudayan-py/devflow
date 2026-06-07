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
- Keep authentication route work small and use shared auth validation schemas when implemented.

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

## Planned Authentication Routes

These routes are planned for Phase 1 authentication, but are not implemented yet:

| Method | Route          | Purpose                               |
| ------ | -------------- | ------------------------------------- |
| POST   | `/auth/signup` | Create a user with email and password |
| POST   | `/auth/login`  | Authenticate with email and password  |
| GET    | `/auth/me`     | Return the current authenticated user |
| POST   | `/auth/logout` | End the current authenticated session |

`POST /auth/signup` should validate request bodies with `signupSchema`. `POST /auth/login` should
validate request bodies with `loginSchema`.

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
