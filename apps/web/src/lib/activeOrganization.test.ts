import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearActiveOrganizationId,
  getStoredActiveOrganizationId,
  resolveActiveOrganization,
  setActiveOrganizationId,
} from "./activeOrganization";

function stubWindowWithLocalStorage() {
  const store = new Map<string, string>();

  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });

  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("active organization storage", () => {
  it("returns null when nothing is stored", () => {
    stubWindowWithLocalStorage();

    expect(getStoredActiveOrganizationId()).toBeNull();
  });

  it("stores, reads, and clears the active organization id", () => {
    stubWindowWithLocalStorage();

    setActiveOrganizationId("org-1");
    expect(getStoredActiveOrganizationId()).toBe("org-1");

    clearActiveOrganizationId();
    expect(getStoredActiveOrganizationId()).toBeNull();
  });

  it("is a no-op without a window (SSR)", () => {
    expect(getStoredActiveOrganizationId()).toBeNull();
    expect(() => setActiveOrganizationId("org-1")).not.toThrow();
    expect(() => clearActiveOrganizationId()).not.toThrow();
  });
});

describe("resolveActiveOrganization", () => {
  const organizations = [{ id: "org-1" }, { id: "org-2" }];

  it("returns the stored organization when the user still belongs to it", () => {
    expect(resolveActiveOrganization(organizations, "org-2")).toEqual({ id: "org-2" });
  });

  it("falls back to the first organization when the stored one is gone", () => {
    expect(resolveActiveOrganization(organizations, "org-deleted")).toEqual({ id: "org-1" });
  });

  it("falls back to the first organization when nothing is stored", () => {
    expect(resolveActiveOrganization(organizations, null)).toEqual({ id: "org-1" });
  });

  it("returns null when the user has no organizations", () => {
    expect(resolveActiveOrganization([], "org-1")).toBeNull();
  });
});
