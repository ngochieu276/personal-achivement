import type { KpiTypePeriod, Prisma, Subject } from "./generated/prisma/client.ts";
import { prisma } from "./db.ts";

const CLOSER_LOCK_ID = "period-closer";
const CLOSER_LOCK_TTL_MS = 10 * 60 * 1000;
const DEFAULT_TZ = "UTC";

export function isValidTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value.length > 0 && value.length < 80;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value?: string | null) {
  return value && isValidTimeZone(value) ? value : DEFAULT_TZ;
}

type ZonedParts = { year: number; month: number; day: number };

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function zonedWeekday(date: Date, timeZone: string) {
  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

function tzOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return asUtc - date.getTime();
}

export function zonedDate(year: number, month: number, day: number, timeZone: string) {
  const utc = Date.UTC(year, month - 1, day);
  let date = new Date(utc);
  const offset = tzOffsetMs(date, timeZone);
  date = new Date(utc - offset);
  const again = tzOffsetMs(date, timeZone);
  if (again !== offset) date = new Date(utc - again);
  return date;
}

export function zonedDateKey(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

export function startOfZonedDay(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return zonedDate(parts.year, parts.month, parts.day, timeZone);
}

function addZonedDays(date: Date, amount: number, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const civil = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return zonedDate(civil.getUTCFullYear(), civil.getUTCMonth() + 1, civil.getUTCDate(), timeZone);
}

function addZonedMonths(date: Date, amount: number, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const civil = new Date(Date.UTC(parts.year, parts.month - 1 + amount, 1));
  return zonedDate(civil.getUTCFullYear(), civil.getUTCMonth() + 1, 1, timeZone);
}

export function startOfIsoWeek(date: Date, timeZone = DEFAULT_TZ) {
  const day = startOfZonedDay(date, timeZone);
  const weekday = zonedWeekday(day, timeZone);
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addZonedDays(day, -offset, timeZone);
}

export function parseStartDate(value: string, timeZone = DEFAULT_TZ) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return zonedDate(year, month, day, resolveTimeZone(timeZone));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function startOfUtcDay(date: Date) {
  return startOfZonedDay(date, DEFAULT_TZ);
}

export function startOfIsoWeekUtc(date: Date) {
  return startOfIsoWeek(date, DEFAULT_TZ);
}

/** Snap a date to the first day of its KPI cycle in the given timezone. */
export function alignCycleStart(date: Date, period: KpiTypePeriod, timeZone = DEFAULT_TZ) {
  const tz = resolveTimeZone(timeZone);
  const day = startOfZonedDay(date, tz);
  switch (period) {
    case "day":
      return day;
    case "week":
      return startOfIsoWeek(day, tz);
    case "twoWeek": {
      const monday = startOfIsoWeek(day, tz);
      const epoch = startOfIsoWeek(zonedDate(1970, 1, 5, tz), tz);
      const epochParts = zonedParts(epoch, tz);
      const mondayParts = zonedParts(monday, tz);
      const diffDays = Math.floor(
        (Date.UTC(mondayParts.year, mondayParts.month - 1, mondayParts.day) -
          Date.UTC(epochParts.year, epochParts.month - 1, epochParts.day)) /
          86_400_000,
      );
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex % 2 !== 0) return addZonedDays(monday, -7, tz);
      return monday;
    }
    case "month": {
      const parts = zonedParts(day, tz);
      return zonedDate(parts.year, parts.month, 1, tz);
    }
  }
}

export function addPeriod(
  date: Date,
  period: KpiTypePeriod,
  n: number,
  timeZone = DEFAULT_TZ,
): Date {
  const tz = resolveTimeZone(timeZone);
  switch (period) {
    case "day":
      return addZonedDays(date, n, tz);
    case "week":
      return addZonedDays(date, n * 7, tz);
    case "twoWeek":
      return addZonedDays(date, n * 14, tz);
    case "month":
      return addZonedMonths(date, n, tz);
  }
}

export function getPeriodIndex(
  startDate: Date,
  period: KpiTypePeriod,
  now: Date,
  timeZone = DEFAULT_TZ,
): number {
  let index = 0;
  while (addPeriod(startDate, period, index + 1, timeZone) <= now) {
    index += 1;
    if (index > 20_000) break;
  }
  return index;
}

export function getPeriodWindow(
  startDate: Date,
  period: KpiTypePeriod,
  index: number,
  timeZone = DEFAULT_TZ,
) {
  return {
    start: addPeriod(startDate, period, index, timeZone),
    end: addPeriod(startDate, period, index + 1, timeZone),
    index,
  };
}

export function getActiveWindow(
  startDate: Date,
  period: KpiTypePeriod,
  now = new Date(),
  timeZone = DEFAULT_TZ,
) {
  const origin = alignCycleStart(startDate, period, timeZone);
  if (now < origin) {
    return getPeriodWindow(origin, period, 0, timeZone);
  }
  return getPeriodWindow(origin, period, getPeriodIndex(origin, period, now, timeZone), timeZone);
}

export function nextCloseAtFor(
  startDate: Date,
  period: KpiTypePeriod,
  now = new Date(),
  timeZone = DEFAULT_TZ,
) {
  return getActiveWindow(startDate, period, now, timeZone).end;
}

function sameInstant(left: Date | null | undefined, right: Date) {
  return left != null && left.getTime() === right.getTime();
}

function isDue(
  subject: Pick<Subject, "startDate" | "kpiTypePeriod" | "nextCloseAt">,
  now: Date,
  timeZone: string,
) {
  const window = getActiveWindow(subject.startDate, subject.kpiTypePeriod, now, timeZone);
  if (!subject.nextCloseAt) return true;
  if (subject.nextCloseAt <= now) return true;
  return subject.nextCloseAt.getTime() !== window.end.getTime() && subject.nextCloseAt > window.start;
}

async function tryAcquireCloserLock() {
  const cutoff = new Date(Date.now() - CLOSER_LOCK_TTL_MS);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "JobLock"
    SET "lockedAt" = NOW()
    WHERE id = ${CLOSER_LOCK_ID}
      AND "lockedAt" < ${cutoff}
    RETURNING id
  `;
  return rows.length > 0;
}

async function releaseCloserLock() {
  await prisma.$executeRaw`
    UPDATE "JobLock"
    SET "lockedAt" = TIMESTAMP '1970-01-01 00:00:00'
    WHERE id = ${CLOSER_LOCK_ID}
  `;
}

async function persistNextCloseAt(
  tx: Prisma.TransactionClient,
  subject: Subject,
  nextCloseAt: Date,
) {
  if (sameInstant(subject.nextCloseAt, nextCloseAt)) return subject;
  return await tx.subject.update({
    where: { id: subject.id },
    data: { nextCloseAt },
  });
}

async function closeLoadedSubject(
  tx: Prisma.TransactionClient,
  subject: Subject,
  now: Date,
  timeZone: string,
) {
  const origin = alignCycleStart(subject.startDate, subject.kpiTypePeriod, timeZone);
  const nextCloseAt = nextCloseAtFor(origin, subject.kpiTypePeriod, now, timeZone);
  if (now < origin) {
    return await persistNextCloseAt(tx, subject, nextCloseAt);
  }

  const currentIndex = getPeriodIndex(origin, subject.kpiTypePeriod, now, timeZone);
  if (currentIndex <= 0) {
    return await persistNextCloseAt(tx, subject, nextCloseAt);
  }

  const existing = await tx.subjectEvent.findMany({
    where: { subjectId: subject.id },
    select: { periodStart: true },
  });
  const existingStarts = new Set(
    existing.map((event) => event.periodStart.toISOString()),
  );

  let usedCurrentProgress = false;
  let streak = subject.currentStreak;
  let closedAny = false;

  for (let i = 0; i < currentIndex; i++) {
    const window = getPeriodWindow(origin, subject.kpiTypePeriod, i, timeZone);
    if (existingStarts.has(window.start.toISOString())) continue;

    const progress = usedCurrentProgress ? 0 : subject.currentProgress;
    const status = progress >= subject.kpi ? "finish" : "miss";
    streak = status === "finish" ? streak + 1 : 0;

    const event = await tx.subjectEvent.create({
      data: {
        subjectId: subject.id,
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
        subjectId: subject.id,
        type: "subject_event",
        subjectEventId: event.id,
        payload: { status, progress, kpi: subject.kpi },
      },
    });

    if (status === "finish") {
      await tx.subjectHistory.create({
        data: {
          subjectId: subject.id,
          type: "streak_hit",
          subjectEventId: event.id,
          payload: { streak },
        },
      });
    }

    usedCurrentProgress = true;
    closedAny = true;
  }

  if (!closedAny) {
    return await persistNextCloseAt(tx, subject, nextCloseAt);
  }

  return await tx.subject.update({
    where: { id: subject.id },
    data: {
      currentProgress: 0,
      currentStreak: streak,
      nextCloseAt,
    },
  });
}

export async function recomputeCurrentStreak(
  tx: Prisma.TransactionClient,
  subjectId: string,
) {
  const events = await tx.subjectEvent.findMany({
    where: { subjectId },
    orderBy: { periodStart: "asc" },
    select: { status: true },
  });
  let currentStreak = 0;
  for (const event of events) {
    currentStreak = event.status === "finish" ? currentStreak + 1 : 0;
  }
  return await tx.subject.update({
    where: { id: subjectId },
    data: { currentStreak },
    select: { currentStreak: true },
  });
}

async function timezoneForSubjectId(subjectId: string) {
  const row = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { project: { select: { user: { select: { timezone: true } } } } },
  });
  return resolveTimeZone(row?.project.user.timezone);
}

export async function closeOverdueForSubject(
  subjectId: string,
  now = new Date(),
  loaded?: Subject | null,
  timeZone?: string,
) {
  try {
    const tz = resolveTimeZone(timeZone ?? await timezoneForSubjectId(subjectId));
    const current = loaded ?? await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!current) return null;
    if (!isDue(current, now, tz)) return current;

    return await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.findUnique({ where: { id: subjectId } });
      if (!subject) return null;
      if (!isDue(subject, now, tz)) return subject;
      return await closeLoadedSubject(tx, subject, now, tz);
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
  const acquired = await tryAcquireCloserLock();
  if (!acquired) return;
  try {
    const horizon = new Date(now.getTime() + 36 * 60 * 60 * 1000);
    const due = await prisma.subject.findMany({
      where: {
        OR: [{ nextCloseAt: null }, { nextCloseAt: { lte: horizon } }],
      },
      select: { id: true },
    });
    for (const subject of due) {
      await closeOverdueForSubject(subject.id, now);
    }
  } finally {
    await releaseCloserLock();
  }
}
