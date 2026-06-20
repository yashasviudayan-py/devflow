-- AlterEnum
-- New notification categories for the events the API now notifies on. Existing
-- rows are untouched; these values are simply appended to the enum.
ALTER TYPE "NotificationType" ADD VALUE 'TASK_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_PRIORITY_CHANGED';

-- AlterTable
-- Records the user who triggered the notification (e.g. who assigned the task or
-- left the comment). Nullable so a notification can have no actor, and so history
-- survives the actor's account removal via the SetNull foreign key below.
ALTER TABLE "Notification" ADD COLUMN "actorId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
