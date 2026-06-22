import { describe, expect, it } from "vitest";
import { AppError, codeForStatus } from "./app-error.js";

describe("codeForStatus", () => {
  it("maps known statuses to their stable codes", () => {
    expect(codeForStatus(400)).toBe("BAD_REQUEST");
    expect(codeForStatus(401)).toBe("UNAUTHORIZED");
    expect(codeForStatus(403)).toBe("FORBIDDEN");
    expect(codeForStatus(404)).toBe("NOT_FOUND");
    expect(codeForStatus(409)).toBe("CONFLICT");
    expect(codeForStatus(500)).toBe("INTERNAL_SERVER_ERROR");
  });

  it("falls back by status class for unmapped statuses", () => {
    expect(codeForStatus(422)).toBe("BAD_REQUEST");
    expect(codeForStatus(503)).toBe("INTERNAL_SERVER_ERROR");
  });
});

describe("AppError", () => {
  it("derives the code from the status when none is given", () => {
    const error = new AppError("Task not found", 404);

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
  });

  it("uses an explicit code and details when provided", () => {
    const error = new AppError("Invalid request body", 400, {
      code: "VALIDATION_ERROR",
      details: [{ field: "email", message: "Invalid email address" }],
    });

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([{ field: "email", message: "Invalid email address" }]);
  });

  it("defaults to a 500 INTERNAL_SERVER_ERROR", () => {
    const error = new AppError("boom");

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
