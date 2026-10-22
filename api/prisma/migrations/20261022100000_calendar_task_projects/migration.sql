-- CreateTable
CREATE TABLE "CalendarTaskProject" (
    "calendarTaskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "CalendarTaskProject_pkey" PRIMARY KEY ("calendarTaskId","projectId")
);

-- Migrate existing task-project links
INSERT INTO "CalendarTaskProject" ("calendarTaskId", "projectId")
SELECT "id", "projectId" FROM "CalendarTask";

-- CreateIndex
CREATE INDEX "CalendarTaskProject_projectId_idx" ON "CalendarTaskProject"("projectId");

-- AddForeignKey
ALTER TABLE "CalendarTaskProject" ADD CONSTRAINT "CalendarTaskProject_calendarTaskId_fkey" FOREIGN KEY ("calendarTaskId") REFERENCES "CalendarTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarTaskProject" ADD CONSTRAINT "CalendarTaskProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "CalendarTask" DROP CONSTRAINT "CalendarTask_projectId_fkey";

-- DropIndex
DROP INDEX "CalendarTask_projectId_startsAt_idx";

-- AlterTable
ALTER TABLE "CalendarTask" DROP COLUMN "projectId";

-- CreateIndex
CREATE INDEX "CalendarTask_startsAt_idx" ON "CalendarTask"("startsAt");
