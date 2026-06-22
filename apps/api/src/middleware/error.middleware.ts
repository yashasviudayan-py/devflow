import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError, type ErrorCode, type ErrorDetail } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

// `HttpError` is kept as an alias of `AppError` so existing call sites
// (`new HttpError(message, statusCode)`) keep working unchanged while gaining a
// stable `code` derived from the status. New code can use either name.
export { AppError as HttpError } from "../utils/app-error.js";

// The standard error response body. `message`/`statusCode` are retained for
// backward compatibility; `code` is always present, `details` only for
// validation errors, and `requestId`/`stack` are added when useful/safe.
type ErrorResponseBody = {
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: ErrorDetail[];
    requestId?: string;
    stack?: string;
  };
};

type ZodLikeIssue = {
  path: Array<string | number>;
  message: string;
};

// Detect a ZodError structurally (by `name` + `issues`) rather than importing
// zod, which is a transitive dependency (via @devflow/shared) and not a direct
// one of this package. This keeps the API free of an extra direct dependency.
function isZodError(error: unknown): error is { name: string; issues: ZodLikeIssue[] } {
  return (
    error instanceof Error &&
    error.name === "ZodError" &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

function toErrorDetails(issues: ZodLikeIssue[]): ErrorDetail[] {
  return issues.map((issue) => ({
    // The top-level object itself (e.g. a schema-wide `.refine`) has an empty
    // path; label it so the detail is still meaningful.
    field: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  // Express requires the 4-arg signature to treat this as an error handler.
  _next: NextFunction,
) => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (isZodError(error)) {
    // Validation failures become a 400 with field-level details. The message is
    // kept generic and stable; the specifics live in `details`.
    appError = new AppError("Invalid request body", 400, {
      code: "VALIDATION_ERROR",
      details: toErrorDetails(error.issues),
    });
  } else {
    // Anything else is an unexpected bug. Mask the real message (it may leak
    // internals) and flag it non-operational so it is logged loudly below.
    appError = new AppError("Internal server error", 500, { code: "INTERNAL_SERVER_ERROR" });
    appError.isOperational = false;
  }

  const requestId = req.id;

  // Log unexpected errors (and any 5xx) with request context so they are easy to
  // find; expected operational errors (400/401/403/404/409) are left to the
  // request logger to avoid noise. The original error is logged, never the
  // masked one, so the real cause is preserved server-side.
  if (!appError.isOperational || appError.statusCode >= 500) {
    logger.error("Unhandled request error", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: appError.statusCode,
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }

  const body: ErrorResponseBody = {
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
    },
  };

  if (appError.details) {
    body.error.details = appError.details;
  }

  if (requestId) {
    body.error.requestId = requestId;
  }

  // Expose a stack trace only in local development, and only for unexpected
  // errors (where the masked message is unhelpful for debugging). Never in
  // production, and not in tests so assertions stay deterministic.
  if (env.NODE_ENV === "development" && !appError.isOperational && error instanceof Error) {
    body.error.stack = error.stack;
  }

  res.status(appError.statusCode).json(body);
};
