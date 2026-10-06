-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "orderIndex" INTEGER;

-- CreateIndex
CREATE INDEX "Subject_projectId_orderIndex_idx" ON "Subject"("projectId", "orderIndex");
