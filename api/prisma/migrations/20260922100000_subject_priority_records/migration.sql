-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "isPriority" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SubjectRecord" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recordNumber" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectRecord_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single record numbers
INSERT INTO "SubjectRecord" ("id", "subjectId", "date", "recordNumber", "createdAt")
SELECT concat('rec_', "id"), "id", CURRENT_TIMESTAMP, "recordNumber", CURRENT_TIMESTAMP
FROM "Subject"
WHERE "recordNumber" IS NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "recordNumber";

-- CreateIndex
CREATE INDEX "SubjectRecord_subjectId_idx" ON "SubjectRecord"("subjectId");

-- AddForeignKey
ALTER TABLE "SubjectRecord" ADD CONSTRAINT "SubjectRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
