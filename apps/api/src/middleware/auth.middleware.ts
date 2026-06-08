import type { NextFunction, Request, Response } from "express";
import { getUserById } from "../services/auth.service.js";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/jwt.js";
import { HttpError } from "./error.middleware.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (typeof token !== "string") {
      next(new HttpError("Not authenticated", 401));
      return;
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
      next(new HttpError("Not authenticated", 401));
      return;
    }

    const user = await getUserById(payload.userId);

    if (!user) {
      next(new HttpError("Not authenticated", 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
