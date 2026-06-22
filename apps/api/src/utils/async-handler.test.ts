import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "./async-handler.js";

// Lets the deferred promise chain inside asyncHandler settle before asserting.
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("asyncHandler", () => {
  it("forwards a rejected promise to next()", async () => {
    const error = new Error("async failure");
    const next = vi.fn() as unknown as NextFunction;

    const handler = asyncHandler(async () => {
      throw error;
    });

    handler({} as Request, {} as Response, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards a synchronously thrown error to next()", async () => {
    const error = new Error("sync failure");
    const next = vi.fn() as unknown as NextFunction;

    const handler = asyncHandler(() => {
      throw error;
    });

    handler({} as Request, {} as Response, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not call next() when the handler resolves", async () => {
    const next = vi.fn() as unknown as NextFunction;

    const handler = asyncHandler(async (_req, res) => {
      (res as Response).statusCode = 200;
    });

    handler({} as Request, { statusCode: 0 } as Response, next);
    await flush();

    expect(next).not.toHaveBeenCalled();
  });
});
