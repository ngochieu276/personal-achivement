-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "nextCloseAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "JobLock" (
    "id" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subject_nextCloseAt_idx" ON "Subject"("nextCloseAt");

INSERT INTO "JobLock" ("id", "lockedAt") VALUES ('period-closer', TIMESTAMP '1970-01-01 00:00:00');
