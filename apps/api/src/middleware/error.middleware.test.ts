import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/app-error.js";
import { errorMiddleware, HttpError, notFoundMiddleware } from "./error.middleware.js";

// A minimal Response double that records the status/json it was handed.
function mockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// A minimal Request double carrying just the fields the middleware reads.
function mockRequest(overrides: Partial<Request> = {}) {
  return { method: "GET", originalUrl: "/test", ...overrides } as Request;
}

describe("errorMiddleware", () => {
  it("passes through an AppError's status, message, and derived code", () => {
    const res = mockResponse();

    errorMiddleware(new HttpError("Forbidden", 403), mockRequest(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "FORBIDDEN", message: "Forbidden", statusCode: 403 },
    });
  });

  it("includes an explicit code and details when given on the AppError", () => {
    const res = mockResponse();

    errorMiddleware(
      new AppError("Invalid request body", 400, {
        code: "VALIDATION_ERROR",
        details: [{ field: "email", message: "Invalid email address" }],
      }),
      mockRequest(),
      res,
      vi.fn(),
    );

    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        statusCode: 400,
        details: [{ field: "email", message: "Invalid email address" }],
      },
    });
  });

  it("formats a ZodError into a 400 VALIDATION_ERROR with field details", () => {
    const res = mockResponse();
    // Structurally a ZodError: name === "ZodError" with an `issues` array.
    const zodError = Object.assign(new Error("invalid"), {
      name: "ZodError",
      issues: [{ path: ["email"], message: "Invalid email address" }],
    });

    errorMiddleware(zodError, mockRequest(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        statusCode: 400,
        details: [{ field: "email", message: "Invalid email address" }],
      },
    });
  });

  it("masks the message of an unexpected error as a generic 500", () => {
    const res = mockResponse();

    errorMiddleware(new Error("connection string leaked"), mockRequest(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error", statusCode: 500 },
    });
  });

  it("includes the request id in the response when present", () => {
    const res = mockResponse();

    errorMiddleware(new HttpError("Not found", 404), mockRequest({ id: "req-123" }), res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND", message: "Not found", statusCode: 404, requestId: "req-123" },
    });
  });
});

describe("notFoundMiddleware", () => {
  it("forwards a 404 AppError describing the unmatched route", () => {
    const next = vi.fn();

    notFoundMiddleware({ method: "GET", originalUrl: "/missing" } as Request, mockResponse(), next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toContain("GET /missing");
  });
});
