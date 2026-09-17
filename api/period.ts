import type { KpiTypePeriod } from "./generated/prisma/client.ts";
import { prisma } from "./db.ts";

export function addPeriod(
  date: Date,
  period: KpiTypePeriod,
  n: number,
): Date {
  const next = new Date(date.getTime());
  switch (period) {
    case "day":
      next.setUTCDate(next.getUTCDate() + n);
      break;
    case "week":
      next.setUTCDate(next.getUTCDate() + n * 7);
      break;
    case "twoWeek":
      next.setUTCDate(next.getUTCDate() + n * 14);
      break;
    case "month":
      next.setUTCMonth(next.getUTCMonth() + n);
      break;
  }
  return next;
}

export function getPeriodIndex(
  startDate: Date,
  period: KpiTypePeriod,
  now: Date,
): number {
  let index = 0;
  while (addPeriod(startDate, period, index + 1) <= now) {
    index += 1;
    if (index > 20_000) break;
  }
  return index;
}

export function getPeriodWindow(
  startDate: Date,
  period: KpiTypePeriod,
  index: number,
) {
  return {
    start: addPeriod(startDate, period, index),
    end: addPeriod(startDate, period, index + 1),
    index,
  };
}

export function getActiveWindow(
  startDate: Date,
  period: KpiTypePeriod,
  now = new Date(),
) {
  if (now < startDate) {
    return getPeriodWindow(startDate, period, 0);
  }
  return getPeriodWindow(startDate, period, getPeriodIndex(startDate, period, now));
}

export async function closeOverdueForSubject(
  subjectId: string,
  now = new Date(),
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({ where: { id: subjectId } });
      if (!subject) return null;
      if (now < subject.startDate) return subject;

      const currentIndex = getPeriodIndex(
        subject.startDate,
        subject.kpiTypePeriod,
        now,
      );
      if (currentIndex <= 0) return subject;

      const existing = await tx.subjectEvent.findMany({
        where: { subjectId },
        select: { periodStart: true },
      });
      const existingStarts = new Set(
        existing.map((event) => event.periodStart.toISOString()),
      );

      let usedCurrentProgress = false;
      let streak = subject.currentStreak;
      let closedAny = false;

      for (let i = 0; i < currentIndex; i++) {
        const window = getPeriodWindow(
          subject.startDate,
          subject.kpiTypePeriod,
          i,
        );
        if (existingStarts.has(window.start.toISOString())) continue;

        const progress = usedCurrentProgress ? 0 : subject.currentProgress;
        const status = progress >= subject.kpi ? "finish" : "miss";
        streak = status === "finish" ? streak + 1 : 0;

        const event = await tx.subjectEvent.create({
          data: {
            subjectId,
            status,
            date: window.end,
            periodStart: window.start,
            periodEnd: window.end,
            progress,
            kpiSnapshot: subject.kpi,
          },
        });

        await tx.subjectHistory.create({
          data: {
            subjectId,
            type: "subject_event",
            subjectEventId: event.id,
            payload: { status, progress, kpi: subject.kpi },
          },
        });

        if (status === "finish") {
          await tx.subjectHistory.create({
            data: {
              subjectId,
              type: "streak_hit",
              subjectEventId: event.id,
              payload: { streak },
            },
          });
        }

        usedCurrentProgress = true;
        closedAny = true;
      }

      if (!closedAny) return subject;

      return await tx.subject.update({
        where: { id: subjectId },
        data: {
          currentProgress: 0,
          currentStreak: streak,
        },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return await prisma.subject.findUnique({ where: { id: subjectId } });
    }
    throw error;
  }
}

export async function closeAllOverdue(now = new Date()) {
  const subjects = await prisma.subject.findMany({ select: { id: true } });
  for (const subject of subjects) {
    await closeOverdueForSubject(subject.id, now);
  }
}
