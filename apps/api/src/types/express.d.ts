import type { SafeUser } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};
