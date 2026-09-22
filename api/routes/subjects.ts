import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { iconSchema, normalizeIcon } from "../icon.ts";
import { prisma } from "../db.ts";
import {
  alignCycleStart,
  closeOverdueForSubject,
  getActiveWindow,
  parseStartDate,
} from "../period.ts";

const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  icon: iconSchema,
  kpi: z.number().positive().optional(),
  kpiTypePeriod: z.enum(["day", "week", "twoWeek", "month"]).optional(),
  kpiType: z.enum(["totalTime", "totalRepeat"]).optional(),
  startDate: z.string().min(1).optional(),
  link: z.string().url().optional().or(z.literal("")).nullable(),
  note: z.string().max(8000).optional().nullable(),
  documents: z.array(z.string().trim().url().max(500)).max(50).optional(),
});

const progressSchema = z.object({
  currentProgress: z.number().min(0).optional(),
  add: z.number().positive().optional(),
}).refine(
  (value) => value.currentProgress !== undefined || value.add !== undefined,
  { message: "currentProgress or add is required" },
);

export const subjectRoutes = new Hono<{ Variables: { user: AuthUser } }>();
subjectRoutes.use("*", authMiddleware);

async function ownedSubject(userId: string, subjectId: string) {
  return await prisma.subject.findFirst({
    where: {
      id: subjectId,
      project: { userId },
    },
  });
}

async function subjectDetail(subjectId: string, now = new Date()) {
  const closed = await closeOverdueForSubject(subjectId, now);
  if (!closed) return null;

  const [events, history] = await Promise.all([
    prisma.subjectEvent.findMany({
      where: { subjectId },
      orderBy: { periodStart: "desc" },
    }),
    prisma.subjectHistory.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    subject: closed,
    activeWindow: getActiveWindow(closed.startDate, closed.kpiTypePeriod, now),
    events,
    history,
  };
}

subjectRoutes.get("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);
  const detail = await subjectDetail(existing.id);
  return c.json(detail);
});

subjectRoutes.patch("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = updateSubjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  await closeOverdueForSubject(existing.id);

  let startDate = existing.startDate;
  if (parsed.data.startDate || parsed.data.kpiTypePeriod) {
    const raw = parsed.data.startDate
      ? parseStartDate(parsed.data.startDate)
      : existing.startDate;
    if (!raw) return c.json({ error: "Invalid startDate" }, 400);
    startDate = alignCycleStart(
      raw,
      parsed.data.kpiTypePeriod ?? existing.kpiTypePeriod,
    );
  }

  const nextKpi = parsed.data.kpi ?? existing.kpi;
  const subject = await prisma.subject.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name ?? existing.name,
      icon: parsed.data.icon === undefined ? existing.icon : normalizeIcon(parsed.data.icon),
      kpi: nextKpi,
      kpiTypePeriod: parsed.data.kpiTypePeriod ?? existing.kpiTypePeriod,
      kpiType: parsed.data.kpiType ?? existing.kpiType,
      startDate,
      link: parsed.data.link === undefined
        ? existing.link
        : parsed.data.link
        ? parsed.data.link
        : null,
      note: parsed.data.note === undefined
        ? existing.note
        : parsed.data.note?.trim() || null,
      documents: parsed.data.documents ?? existing.documents,
    },
  });

  if (parsed.data.kpi !== undefined && parsed.data.kpi !== existing.kpi) {
    await prisma.subjectHistory.create({
      data: {
        subjectId: existing.id,
        type: "kpi_change",
        payload: { oldKpi: existing.kpi, newKpi: parsed.data.kpi },
      },
    });
  }

  const detail = await subjectDetail(subject.id);
  return c.json(detail);
});

subjectRoutes.delete("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);
  await prisma.subject.delete({ where: { id: existing.id } });
  return c.json({ ok: true });
});

subjectRoutes.put("/:id/progress", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = progressSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const closed = await closeOverdueForSubject(existing.id);
  const subject = closed ?? existing;
  const base = subject.currentProgress;
  const currentProgress = parsed.data.add !== undefined
    ? base + parsed.data.add
    : parsed.data.currentProgress!;
  const amount = parsed.data.add !== undefined
    ? parsed.data.add
    : currentProgress - base;
  const window = getActiveWindow(subject.startDate, subject.kpiTypePeriod);
  const firedAt = new Date().toISOString();

  await prisma.$transaction([
    prisma.subject.update({
      where: { id: existing.id },
      data: { currentProgress },
    }),
    prisma.subjectHistory.create({
      data: {
        subjectId: existing.id,
        type: "kpi_done",
        payload: {
          kind: parsed.data.add !== undefined ? "add" : "set",
          amount,
          total: currentProgress,
          firedAt,
          periodStart: window.start.toISOString(),
        },
      },
    }),
  ]);

  const detail = await subjectDetail(existing.id);
  return c.json(detail);
});
