import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
};
