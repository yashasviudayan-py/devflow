"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, type AuthUser } from "@/lib/api";

/**
 * Loads the current user via GET /auth/me and redirects to /login when the
 * session is missing or expired. Returns null while loading or redirecting.
 */
export function useRequireUser(): AuthUser | null {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isActive) {
          router.replace("/login");
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  return user;
}
