import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { cacheGet, cacheSet } from "../cache.ts";
import { prisma } from "../db.ts";
import { addPeriod, alignCycleStart, startOfIsoWeekUtc, startOfUtcDay } from "../period.ts";

const ACTIVITY_TYPES = ["kpi_done", "subject_event"] as const;
const periodSchema = z.enum(["day", "week", "month"]);
const rangeSchema = z.enum(["month", "3months", "6months"]);

export const statsRoutes = new Hono<{ Variables: { user: AuthUser } }>();
statsRoutes.use("*", authMiddleware);

function dateKey(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function activityWindow(now = new Date()) {
  const today = startOfUtcDay(now);
  const to = addPeriod(today, "day", 1);
  const from = startOfIsoWeekUtc(addPeriod(today, "week", -52));
  return { from, to };
}

function monthsForRange(range: z.infer<typeof rangeSchema>) {
  if (range === "month") return 1;
  if (range === "3months") return 3;
  return 6;
}

function cycleRangeStart(
  range: z.infer<typeof rangeSchema>,
  period: z.infer<typeof periodSchema>,
  now: Date,
) {
  const today = startOfUtcDay(now);
  const raw = addPeriod(today, "month", -monthsForRange(range));
  return alignCycleStart(raw, period);
}

function cycleBuckets(period: z.infer<typeof periodSchema>, from: Date, to: Date) {
  const buckets: Date[] = [];
  let cursor = from;
  while (cursor < to) {
    buckets.push(cursor);
    cursor = addPeriod(cursor, period, 1);
    if (buckets.length > 400) break;
  }
  return buckets;
}

statsRoutes.get("/activity", async (c) => {
  const userId = c.get("user").id;
  const cached = cacheGet<{ from: string; to: string; days: Array<{ date: string; count: number }> }>(
    userId,
    "stats:activity",
  );
  if (cached) return c.json(cached);

  const { from, to } = activityWindow();
  const rows = await prisma.subjectHistory.findMany({
    where: {
      subject: { project: { userId } },
      type: { in: [...ACTIVITY_TYPES] },
      createdAt: { gte: from, lt: to },
    },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = dateKey(row.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const payload = {
    from: dateKey(from),
    to: dateKey(addPeriod(to, "day", -1)),
    days: [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count })),
  };
  cacheSet(userId, "stats:activity", payload);
  return c.json(payload);
});

statsRoutes.get("/cycles", async (c) => {
  const periodParsed = periodSchema.safeParse(c.req.query("period") ?? "week");
  const rangeParsed = rangeSchema.safeParse(c.req.query("range") ?? "3months");
  if (!periodParsed.success || !rangeParsed.success) {
    return c.json({ error: "period must be day, week, or month; range must be month, 3months, or 6months" }, 400);
  }

  const period = periodParsed.data;
  const range = rangeParsed.data;
  const userId = c.get("user").id;
  const cacheKey = `stats:cycles:${period}:${range}`;
  const cached = cacheGet<Record<string, unknown>>(userId, cacheKey);
  if (cached) return c.json(cached);

  const now = new Date();
  const from = cycleRangeStart(range, period, now);
  const today = startOfUtcDay(now);
  const to = addPeriod(today, "day", 1);

  const events = await prisma.subjectEvent.findMany({
    where: {
      subject: { project: { userId }, kpiTypePeriod: period },
      periodStart: { gte: from, lt: to },
    },
    select: { periodStart: true, status: true },
  });

  const byStart = new Map<string, { finish: number; total: number }>();
  for (const event of events) {
    const key = dateKey(event.periodStart);
    const current = byStart.get(key) ?? { finish: 0, total: 0 };
    current.total += 1;
    if (event.status === "finish") current.finish += 1;
    byStart.set(key, current);
  }

  const payload = {
    period,
    range,
    points: cycleBuckets(period, from, today).map((start) => {
      const stats = byStart.get(dateKey(start)) ?? { finish: 0, total: 0 };
      return {
        start: start.toISOString(),
        finish: stats.finish,
        total: stats.total,
      };
    }),
  };
  cacheSet(userId, cacheKey, payload);
  return c.json(payload);
});
