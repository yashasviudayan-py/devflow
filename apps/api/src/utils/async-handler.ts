import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async (or sync) route handler so any thrown error — or rejected
 * promise — is forwarded to Express's error middleware via `next(error)`.
 *
 * Express 4 does not catch rejections from async handlers, so without this every
 * controller needs its own `try/catch`. Wrapping once keeps controllers focused
 * on the happy path while guaranteeing errors still reach the central handler.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    // Invoke the handler inside the promise chain so both synchronous throws and
    // async rejections are funneled to `next` (and thus the error middleware).
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}
