import { env } from "../config/env.js";

/**
 * Minimal structured logger. Emits one JSON object per line so logs are both
 * human-skimmable and machine-parseable, without pulling in a logging
 * framework. This is intentionally small — it is the seam a real logger
 * (pino/winston) or a platform (Datadog/OpenTelemetry) would slot into later.
 *
 * It stays silent under `NODE_ENV=test` so the test output is not flooded with
 * request and error lines; tests assert on responses, not logs.
 */
type LogLevel = "info" | "warn" | "error";

// Lower number = higher severity. A message is emitted only when its severity is
// at least as high as the configured LOG_LEVEL (e.g. LOG_LEVEL=warn drops info).
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
};

// Never log these keys, even if a caller passes them by accident. Secrets and
// credentials must never reach the logs.
const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "jwt",
]);

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    safe[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return safe;
}

function emit(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  // Quiet during tests; errors and requests are asserted via responses instead.
  if (env.NODE_ENV === "test") {
    return;
  }

  // Honour the configured verbosity (default "info" emits everything).
  if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[env.LOG_LEVEL]) {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...redact(meta),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
