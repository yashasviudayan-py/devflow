import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

/**
 * Logs one line per completed request: method, path, status code, and duration.
 *
 * It logs on the response `finish` event (after the status is known) and never
 * touches the request body, headers, or cookies, so credentials, tokens, and
 * JWTs are never written to the logs. The full path including query string
 * (`originalUrl`) is logged because the app's query params are non-sensitive
 * search/filter/pagination values, which are useful when debugging list calls.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info("request", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    });
  });

  next();
}
