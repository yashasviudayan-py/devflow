import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADER = "x-request-id";
// Cap an incoming id so a client cannot push an unbounded string into our logs.
const MAX_REQUEST_ID_LENGTH = 200;

/**
 * Assigns a request id to every request and echoes it back as `X-Request-Id`.
 *
 * If the caller (or an upstream proxy) already sent an `X-Request-Id`, we reuse
 * it so a single id can be traced end to end; otherwise we generate a UUID. The
 * id is attached to `req.id` and included in request/error logs and in error
 * responses, so a user-reported error can be matched to its server log line.
 */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId =
    typeof incoming === "string" && incoming.trim().length > 0
      ? incoming.trim().slice(0, MAX_REQUEST_ID_LENGTH)
      : randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}
