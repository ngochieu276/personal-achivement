-- CreateEnum
CREATE TYPE "TypeOfRecord" AS ENUM ('timePerRep', 'repPerTime', 'maximum', 'fastest', 'defineByUser');

-- CreateEnum
CREATE TYPE "BetterDirection" AS ENUM ('lowerIsBetter', 'higherIsBetter');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "typeOfRecord" "TypeOfRecord";
ALTER TABLE "Subject" ADD COLUMN "betterDirection" "BetterDirection";
ALTER TABLE "Subject" ADD COLUMN "recordNumber" DOUBLE PRECISION;
