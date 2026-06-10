import type { LoginInput, SignupInput } from "@devflow/shared";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

const DEFAULT_API_URL = "http://localhost:4000";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      // The API session lives in an HTTP-only cookie, so every request must
      // opt in to sending credentials across the web/API origins.
      credentials: "include",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the DevFlow API. Is the backend running?", 0);
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error?.message ?? "Something went wrong.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/me");

  return data.user;
}

export async function logout(): Promise<void> {
  await request<{ success: boolean }>("/auth/logout", {
    method: "POST",
  });
}
