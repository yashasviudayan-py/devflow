import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "devflow_auth";

const AUTH_TOKEN_EXPIRES_IN = "7d";
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type AuthTokenPayload = {
  userId: string;
};

function getJwtSecret() {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return env.JWT_SECRET;
}

export function signAuthToken(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: AUTH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload !== "object" || payload === null || typeof payload.userId !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}

/**
 * Base cookie flags shared by the set and clear paths.
 *
 * The browser reaches the API *same-origin* in every environment: in production
 * through the Vercel/Next.js `/api/*` rewrite to Render (see
 * apps/web/next.config.mjs), and locally by calling the API directly. A
 * same-origin request is same-site, so `SameSite=Lax` is sufficient and keeps
 * the cookie first-party — we never need `SameSite=None`, which would mark the
 * cookie cross-site and expose it to third-party-cookie blocking (Safari, Chrome
 * incognito). The only environment difference is `Secure`: on in production
 * (HTTPS), off locally (dev runs over plain HTTP).
 *
 * `isProduction` is a parameter (defaulting to the loaded env) purely so the
 * behaviour is unit-testable without mutating the frozen `env`.
 */
function buildAuthCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
  };
}

export function getAuthCookieOptions(
  isProduction = env.NODE_ENV === "production",
): CookieOptions {
  return {
    ...buildAuthCookieOptions(isProduction),
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  };
}

export function getClearAuthCookieOptions(
  isProduction = env.NODE_ENV === "production",
): CookieOptions {
  return buildAuthCookieOptions(isProduction);
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}
