-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "note" TEXT;
ALTER TABLE "Subject" ADD COLUMN "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
