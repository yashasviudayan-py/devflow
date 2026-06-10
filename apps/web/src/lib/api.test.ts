import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiBaseUrl, getCurrentUser, login, logout, signup } from "./api";

const testUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2026-06-08T00:00:00.000Z",
};

function mockFetchResponse(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getApiBaseUrl", () => {
  it("defaults to the local API URL", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:4000");
  });
});

describe("auth api client", () => {
  it("signs up with credentials included and returns the user", async () => {
    const fetchMock = mockFetchResponse(201, { user: testUser });

    const input = { name: "Test User", email: "test@example.com", password: "password123" };
    const user = await signup(input);

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/signup",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("logs in and returns the user", async () => {
    const fetchMock = mockFetchResponse(200, { user: testUser });

    const user = await login({ email: "test@example.com", password: "password123" });

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/login",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("fetches the current user with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { user: testUser });

    const user = await getCurrentUser();

    expect(user).toEqual(testUser);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("logs out via POST with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { success: true });

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("throws an ApiError with the backend error message", async () => {
    mockFetchResponse(401, { error: { message: "Invalid credentials", statusCode: 401 } });

    const error = await login({ email: "test@example.com", password: "wrong" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Invalid credentials");
    expect((error as ApiError).statusCode).toBe(401);
  });

  it("throws a fallback ApiError when the error body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });
    vi.stubGlobal("fetch", fetchMock);

    const error = await getCurrentUser().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Something went wrong.");
    expect((error as ApiError).statusCode).toBe(500);
  });

  it("throws an ApiError when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await getCurrentUser().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(0);
  });
});
