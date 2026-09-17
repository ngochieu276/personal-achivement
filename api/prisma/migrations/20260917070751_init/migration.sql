-- CreateEnum
CREATE TYPE "KpiTypePeriod" AS ENUM ('day', 'week', 'twoWeek', 'month');

-- CreateEnum
CREATE TYPE "KpiType" AS ENUM ('totalTime', 'totalRepeat');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('miss', 'finish');

-- CreateEnum
CREATE TYPE "HistoryType" AS ENUM ('streak_hit', 'kpi_change', 'subject_event');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kpi" DOUBLE PRECISION NOT NULL,
    "kpiTypePeriod" "KpiTypePeriod" NOT NULL,
    "kpiType" "KpiType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "link" TEXT,
    "currentProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectEvent" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "kpiSnapshot" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectHistory" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" "HistoryType" NOT NULL,
    "subjectEventId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Subject_projectId_idx" ON "Subject"("projectId");

-- CreateIndex
CREATE INDEX "SubjectEvent_subjectId_idx" ON "SubjectEvent"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectEvent_subjectId_periodStart_key" ON "SubjectEvent"("subjectId", "periodStart");

-- CreateIndex
CREATE INDEX "SubjectHistory_subjectId_idx" ON "SubjectHistory"("subjectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectEvent" ADD CONSTRAINT "SubjectEvent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectHistory" ADD CONSTRAINT "SubjectHistory_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectHistory" ADD CONSTRAINT "SubjectHistory_subjectEventId_fkey" FOREIGN KEY ("subjectEventId") REFERENCES "SubjectEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
