-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('active', 'pending', 'ending');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "status" "SubjectStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Subject" ADD COLUMN "statusComment" TEXT;
