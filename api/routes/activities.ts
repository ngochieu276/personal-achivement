import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { startOfIsoWeekUtc, startOfUtcDay } from "../period.ts";

const PAGE_SIZE = 20;

const rangeSchema = z.enum(["week", "month"]);
const PROGRESS_TYPES = ["kpi_done", "subject_event"] as const;

export const activityRoutes = new Hono<{ Variables: { user: AuthUser } }>();
activityRoutes.use("*", authMiddleware);

function rangeStart(range: "week" | "month", now: Date) {
  if (range === "week") return startOfIsoWeekUtc(now);
  const start = startOfUtcDay(now);
  start.setUTCDate(start.getUTCDate() - 30);
  return start;
}

function parseCursor(raw: string | undefined) {
  if (!raw) return null;
  const sep = raw.lastIndexOf("|");
  if (sep <= 0) return null;
  const date = new Date(raw.slice(0, sep));
  const id = raw.slice(sep + 1);
  if (Number.isNaN(date.getTime()) || !id) return null;
  return { date, id };
}

function encodeCursor(createdAt: Date, id: string) {
  return `${createdAt.toISOString()}|${id}`;
}

activityRoutes.get("/", async (c) => {
  const parsedRange = rangeSchema.safeParse(c.req.query("range") ?? "week");
  if (!parsedRange.success) {
    return c.json({ error: "range must be week or month" }, 400);
  }

  const now = new Date();
  const from = rangeStart(parsedRange.data, now);
  const cursor = parseCursor(c.req.query("cursor"));

  const rows = await prisma.subjectHistory.findMany({
    where: {
      subject: { project: { userId: c.get("user").id } },
      type: { in: [...PROGRESS_TYPES] },
      createdAt: { gte: from },
      ...(cursor
        ? {
          OR: [
            { createdAt: { lt: cursor.date } },
            { createdAt: cursor.date, id: { lt: cursor.id } },
          ],
        }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      type: true,
      payload: true,
      createdAt: true,
      subjectId: true,
      subject: {
        select: {
          id: true,
          name: true,
          icon: true,
          kpiType: true,
          projectId: true,
          project: { select: { name: true } },
        },
      },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];

  return c.json({
    range: parsedRange.data,
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      payload: row.payload,
      createdAt: row.createdAt,
      subjectId: row.subjectId,
      subject: {
        id: row.subject.id,
        name: row.subject.name,
        icon: row.subject.icon,
        kpiType: row.subject.kpiType,
        projectId: row.subject.projectId,
        projectName: row.subject.project.name,
      },
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  });
});
