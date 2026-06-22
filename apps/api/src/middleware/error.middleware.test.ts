import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware, HttpError, notFoundMiddleware } from "./error.middleware.js";

// A minimal Response double that records the status/json it was handed.
function mockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("errorMiddleware", () => {
  it("passes through an HttpError's status code and message", () => {
    const res = mockResponse();

    errorMiddleware(new HttpError("Forbidden", 403), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Forbidden", statusCode: 403 },
    });
  });

  it("masks the message of an unexpected error as a generic 500", () => {
    const res = mockResponse();

    errorMiddleware(new Error("connection string leaked"), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Internal server error", statusCode: 500 },
    });
  });
});

describe("notFoundMiddleware", () => {
  it("forwards a 404 HttpError describing the unmatched route", () => {
    const next = vi.fn();

    notFoundMiddleware(
      { method: "GET", originalUrl: "/missing" } as Request,
      mockResponse(),
      next,
    );

    const error = next.mock.calls[0][0] as HttpError;
    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain("GET /missing");
  });
});
