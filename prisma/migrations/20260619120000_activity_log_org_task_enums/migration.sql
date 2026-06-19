-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_ARCHIVED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_PRIORITY_CHANGED', 'TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_ARCHIVED', 'COMMENT_CREATED', 'COMMENT_UPDATED', 'COMMENT_DELETED');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('PROJECT', 'TASK', 'COMMENT');

-- AlterTable
-- Convert the free-text `action`/`entityType` columns to enums in place with a
-- USING cast (non-destructive: existing rows are preserved, not dropped), add the
-- new `organizationId`/`taskId` columns, and relax `projectId` to nullable.
-- Postgres rebuilds the `entityType, entityId` index automatically during the
-- column type change, so it does not need to be recreated here.
ALTER TABLE "ActivityLog"
  ALTER COLUMN "action" TYPE "ActivityAction" USING ("action"::"ActivityAction"),
  ALTER COLUMN "entityType" TYPE "ActivityEntityType" USING ("entityType"::"ActivityEntityType"),
  ADD COLUMN  "organizationId" TEXT NOT NULL,
  ADD COLUMN  "taskId" TEXT,
  ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_idx" ON "ActivityLog"("organizationId");

-- CreateIndex
CREATE INDEX "ActivityLog_taskId_idx" ON "ActivityLog"("taskId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
