import type { OrganizationMembership } from "../middleware/organization.middleware.js";
import type { SafeUser } from "../services/auth.service.js";
import type { ProjectRecord } from "../services/project.service.js";
import type { TaskRecord } from "../services/task.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      organizationMembership?: OrganizationMembership;
      project?: ProjectRecord;
      task?: TaskRecord;
    }
  }
}

export {};
