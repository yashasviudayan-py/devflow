import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { getHealth } from "./health.controller.js";

describe("getHealth", () => {
  it("returns the API health response", () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    getHealth({} as Request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      status: "ok",
      service: "devflow-api",
    });
  });
});
