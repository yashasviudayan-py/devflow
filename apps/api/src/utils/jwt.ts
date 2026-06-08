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

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: "/",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  };
}

export function getClearAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}
