import { loginSchema, signupSchema } from "@devflow/shared";
import type { Request, Response } from "express";
import { loginUser, signupUser } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  AUTH_COOKIE_NAME,
  getClearAuthCookieOptions,
  setAuthCookie,
  signAuthToken,
} from "../utils/jwt.js";

// Validation (Zod) and unexpected errors are forwarded to the central error
// middleware by `asyncHandler`, which formats them into the standard shape.

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const input = signupSchema.parse(req.body);
  const user = await signupUser(input);
  const token = signAuthToken(user.id);

  setAuthCookie(res, token);

  res.status(201).json({
    user,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = await loginUser(input);
  const token = signAuthToken(user.id);

  setAuthCookie(res, token);

  res.status(200).json({
    user,
  });
});

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
