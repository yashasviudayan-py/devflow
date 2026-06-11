// The active organization is a UI preference, not a credential. Storing its id
// in localStorage is safe because every request is still authorized server-side
// via the HTTP-only session cookie — a leaked org id grants no access. Tokens
// must never live in localStorage, where any injected script could read them.
const STORAGE_KEY = "devflow.activeOrganizationId";

function getStorage(): Storage | null {
  // localStorage is unavailable during SSR and can throw in some browser
  // privacy modes, so all access is guarded.
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredActiveOrganizationId(): string | null {
  return getStorage()?.getItem(STORAGE_KEY) ?? null;
}

export function setActiveOrganizationId(organizationId: string): void {
  getStorage()?.setItem(STORAGE_KEY, organizationId);
}

export function clearActiveOrganizationId(): void {
  getStorage()?.removeItem(STORAGE_KEY);
}

/**
 * Picks the active organization from the user's organizations: the stored one
 * if the user still belongs to it, otherwise the first organization, otherwise
 * null. This keeps the dashboard working when the stored organization was
 * deleted or the user was removed from it.
 */
export function resolveActiveOrganization<T extends { id: string }>(
  organizations: T[],
  storedId: string | null,
): T | null {
  if (organizations.length === 0) {
    return null;
  }

  return organizations.find((organization) => organization.id === storedId) ?? organizations[0];
}
