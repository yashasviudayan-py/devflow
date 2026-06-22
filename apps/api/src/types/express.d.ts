import type { OrganizationMembership } from "../middleware/organization.middleware.js";
import type { SafeUser } from "../services/auth.service.js";
import type { CommentRecord } from "../services/comment.service.js";
import type { ProjectRecord } from "../services/project.service.js";
import type { TaskRecord } from "../services/task.service.js";

declare global {
  namespace Express {
    interface Request {
      // Per-request correlation id, set by the requestContext middleware.
      id?: string;
      user?: SafeUser;
      organizationMembership?: OrganizationMembership;
      project?: ProjectRecord;
      task?: TaskRecord;
      comment?: CommentRecord;
    }
  }
}

export {};
