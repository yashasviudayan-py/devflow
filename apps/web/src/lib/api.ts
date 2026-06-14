import type {
  CreateOrganizationInput,
  CreateProjectInput,
  LoginInput,
  SignupInput,
  UpdateProjectInput,
  UserRole,
} from "@devflow/shared";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationWithRole = Organization & {
  role: UserRole;
};

export type Project = {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  // The API stores description as a nullable column, so it can come back as null.
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMember = {
  id: string;
  role: UserRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
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

export async function getOrganizations(): Promise<OrganizationWithRole[]> {
  const data = await request<{ organizations: OrganizationWithRole[] }>("/organizations");

  return data.organizations;
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<OrganizationWithRole> {
  const data = await request<{ organization: OrganizationWithRole }>("/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.organization;
}

export async function getOrganization(organizationId: string): Promise<OrganizationWithRole> {
  const data = await request<{ organization: OrganizationWithRole }>(
    `/organizations/${organizationId}`,
  );

  return data.organization;
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const data = await request<{ members: OrganizationMember[] }>(
    `/organizations/${organizationId}/members`,
  );

  return data.members;
}

export async function getOrganizationProjects(organizationId: string): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>(
    `/organizations/${organizationId}/projects`,
  );

  return data.projects;
}

export async function createProject(
  organizationId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const data = await request<{ project: Project }>(
    `/organizations/${organizationId}/projects`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return data.project;
}

export async function getProject(projectId: string): Promise<Project> {
  const data = await request<{ project: Project }>(`/projects/${projectId}`);

  return data.project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const data = await request<{ project: Project }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  // The API soft-archives on DELETE and responds with { success: true }.
  await request<{ success: boolean }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}
