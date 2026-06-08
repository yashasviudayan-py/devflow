import { loginSchema, signupSchema } from "@devflow/shared";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.middleware.js";
import { loginUser, signupUser } from "../services/auth.service.js";
import {
  AUTH_COOKIE_NAME,
  getClearAuthCookieOptions,
  setAuthCookie,
  signAuthToken,
} from "../utils/jwt.js";

function isValidationError(error: unknown) {
  return error instanceof Error && error.name === "ZodError";
}

function handleControllerError(error: unknown, next: NextFunction) {
  if (isValidationError(error)) {
    next(new HttpError("Invalid request body", 400));
    return;
  }

  next(error);
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = signupSchema.parse(req.body);
    const user = await signupUser(input);
    const token = signAuthToken(user.id);

    setAuthCookie(res, token);

    res.status(201).json({
      user,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const user = await loginUser(input);
    const token = signAuthToken(user.id);

    setAuthCookie(res, token);

    res.status(200).json({
      user,
    });
  } catch (error) {
    handleControllerError(error, next);
  }
}

export function getMe(req: Request, res: Response) {
  res.status(200).json({
    user: req.user,
  });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());

  res.status(200).json({
    success: true,
  });
}
