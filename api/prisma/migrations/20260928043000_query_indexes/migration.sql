-- DropIndex
DROP INDEX IF EXISTS "Subject_projectId_idx";

-- DropIndex
DROP INDEX IF EXISTS "SubjectHistory_subjectId_idx";

-- DropIndex
DROP INDEX IF EXISTS "SubjectRecord_subjectId_idx";

-- CreateIndex
CREATE INDEX "Subject_projectId_isPriority_createdAt_idx" ON "Subject"("projectId", "isPriority", "createdAt");

-- CreateIndex
CREATE INDEX "SubjectEvent_periodEnd_idx" ON "SubjectEvent"("periodEnd");

-- CreateIndex
CREATE INDEX "SubjectHistory_subjectId_createdAt_idx" ON "SubjectHistory"("subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "SubjectRecord_subjectId_date_idx" ON "SubjectRecord"("subjectId", "date");
