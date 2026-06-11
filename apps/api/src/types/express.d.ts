import type { OrganizationMembership } from "../middleware/organization.middleware.js";
import type { SafeUser } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      organizationMembership?: OrganizationMembership;
    }
  }
}

export {};
