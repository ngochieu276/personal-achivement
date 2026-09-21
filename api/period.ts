import type { KpiTypePeriod } from "./generated/prisma/client.ts";
import { prisma } from "./db.ts";

export function parseStartDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function startOfIsoWeekUtc(date: Date) {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

/** Snap a date to the first day of its KPI cycle (UTC). */
export function alignCycleStart(date: Date, period: KpiTypePeriod) {
  const day = startOfUtcDay(date);
  switch (period) {
    case "day":
      return day;
    case "week":
      return startOfIsoWeekUtc(day);
    case "twoWeek": {
      const monday = startOfIsoWeekUtc(day);
      const epoch = Date.UTC(1970, 0, 5);
      const diffDays = Math.floor((monday.getTime() - epoch) / 86_400_000);
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex % 2 !== 0) {
        monday.setUTCDate(monday.getUTCDate() - 7);
      }
      return monday;
    }
    case "month":
      return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
  }
}

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
