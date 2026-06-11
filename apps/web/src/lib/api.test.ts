import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createOrganization,
  getApiBaseUrl,
  getCurrentUser,
  getOrganization,
  getOrganizationMembers,
  getOrganizations,
  login,
  logout,
  signup,
} from "./api";

const testUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2026-06-08T00:00:00.000Z",
};

const testOrganization = {
  id: "org-1",
  name: "Acme Inc",
  slug: "acme-inc",
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-08T00:00:00.000Z",
  role: "OWNER" as const,
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

describe("organization api client", () => {
  it("lists organizations with credentials included", async () => {
    const fetchMock = mockFetchResponse(200, { organizations: [testOrganization] });

    const organizations = await getOrganizations();

    expect(organizations).toEqual([testOrganization]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("creates an organization via POST and returns it", async () => {
    const fetchMock = mockFetchResponse(201, { organization: testOrganization });

    const input = { name: "Acme Inc" };
    const organization = await createOrganization(input);

    expect(organization).toEqual(testOrganization);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("fetches one organization including the user's role", async () => {
    const fetchMock = mockFetchResponse(200, { organization: testOrganization });

    const organization = await getOrganization("org-1");

    expect(organization.role).toBe("OWNER");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("fetches organization members", async () => {
    const testMember = {
      id: "member-1",
      role: "OWNER" as const,
      joinedAt: "2026-06-08T00:00:00.000Z",
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
    };
    const fetchMock = mockFetchResponse(200, { members: [testMember] });

    const members = await getOrganizationMembers("org-1");

    expect(members).toEqual([testMember]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/organizations/org-1/members",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("surfaces the backend error for a duplicate slug", async () => {
    mockFetchResponse(409, { error: { message: "Slug is already in use.", statusCode: 409 } });

    const error = await createOrganization({ name: "Acme Inc", slug: "acme-inc" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Slug is already in use.");
    expect((error as ApiError).statusCode).toBe(409);
  });
});
