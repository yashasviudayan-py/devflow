/**
 * Application-level error type and the small vocabulary of stable error codes
 * the API exposes. `AppError` is the single source of truth for an expected
 * (operational) failure: the error middleware turns it directly into the
 * standard error response shape, so throwing one anywhere in a request is the
 * supported way to produce a clean client-facing error.
 */

// Stable, machine-readable error codes. Clients can branch on these instead of
// matching human-readable messages, which are free to change.
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR";

// A single field-level validation problem, surfaced in `error.details`.
export type ErrorDetail = {
  field: string;
  message: string;
};

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_SERVER_ERROR",
};

/**
 * Derives a stable error code from an HTTP status. This lets existing call sites
 * that only pass `(message, statusCode)` still get a sensible code for free,
 * keeping the migration to `AppError` zero-churn.
 */
export function codeForStatus(statusCode: number): ErrorCode {
  return (
    STATUS_TO_CODE[statusCode] ?? (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST")
  );
}

type AppErrorOptions = {
  code?: ErrorCode;
  details?: ErrorDetail[];
};

export class AppError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: ErrorDetail[];
  // Operational errors are expected failures (bad input, auth, not found) that
  // are safe to surface to the client. Non-operational errors are bugs/crashes
  // the middleware masks as a generic 500 and logs loudly.
  isOperational: boolean;

  constructor(message: string, statusCode = 500, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code ?? codeForStatus(statusCode);
    this.details = options.details;
    this.isOperational = true;
  }
}
