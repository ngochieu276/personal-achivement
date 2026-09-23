import { Hono } from "hono";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { addPeriod, startOfIsoWeekUtc } from "../period.ts";
import { averageProgressPercent, progressPercent } from "../record.ts";

export const statsRoutes = new Hono<{ Variables: { user: AuthUser } }>();
statsRoutes.use("*", authMiddleware);

statsRoutes.get("/dashboard", async (c) => {
  const userId = c.get("user").id;
  const since = addPeriod(startOfIsoWeekUtc(new Date()), "week", -11);

  const [subjects, eventGroups] = await Promise.all([
    prisma.subject.findMany({
      where: { project: { userId } },
      select: { currentProgress: true, kpi: true, currentStreak: true },
    }),
    prisma.subjectEvent.groupBy({
      by: ["status"],
      where: {
        subject: { project: { userId } },
        periodEnd: { gte: since },
      },
      _count: { _all: true },
    }),
  ]);

  const finishes = eventGroups.find((item) => item.status === "finish")?._count._all ?? 0;
  const misses = eventGroups.find((item) => item.status === "miss")?._count._all ?? 0;
  const closed = finishes + misses;

  return c.json({
    summary: {
      subjectCount: subjects.length,
      onTrack: subjects.filter((subject) => progressPercent(subject.currentProgress, subject.kpi) >= 100).length,
      atRisk: subjects.filter((subject) => progressPercent(subject.currentProgress, subject.kpi) < 50).length,
      streakCount: subjects.filter((subject) => subject.currentStreak > 0).length,
      averageProgress: Math.round(averageProgressPercent(subjects) * 10) / 10,
      hitRate: closed === 0 ? null : Math.round((finishes / closed) * 1000) / 10,
    },
  });
});
