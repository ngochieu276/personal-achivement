import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { iconSchema, normalizeIcon } from "../icon.ts";
import { prisma } from "../db.ts";
import {
  alignCycleStart,
  closeOverdueForSubject,
  getActiveWindow,
  nextCloseAtFor,
  parseStartDate,
  recomputeCurrentStreak,
} from "../period.ts";
import { invalidateUserReads } from "../cache.ts";
import { recordFieldShape, recordWriteData, withRecordRefine } from "../record.ts";
import type { Subject } from "../generated/prisma/client.ts";

const updateSubjectSchema = withRecordRefine({
  name: z.string().trim().min(1).max(120).optional(),
  icon: iconSchema,
  kpi: z.number().positive().optional(),
  kpiTypePeriod: z.enum(["day", "week", "twoWeek", "month"]).optional(),
  kpiType: z.enum(["totalTime", "totalRepeat"]).optional(),
  startDate: z.string().min(1).optional(),
  link: z.string().url().optional().or(z.literal("")).nullable(),
  note: z.string().max(8000).optional().nullable(),
  documents: z.array(z.string().trim().url().max(500)).max(50).optional(),
  isPriority: z.boolean().optional(),
  ...recordFieldShape,
});

const createRecordSchema = z.object({
  date: z.string().min(1),
  recordNumber: z.number(),
});

const progressSchema = z.object({
  currentProgress: z.number().min(0).optional(),
  add: z.number().positive().optional(),
}).refine(
  (value) => value.currentProgress !== undefined || value.add !== undefined,
  { message: "currentProgress or add is required" },
);

const eventPatchSchema = z.object({
  kpi: z.number().positive().optional(),
  progress: z.number().min(0).optional(),
}).refine(
  (value) => value.kpi !== undefined || value.progress !== undefined,
  { message: "kpi or progress is required" },
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

async function subjectDetail(
  existing: Subject,
  now = new Date(),
  options: { close?: boolean } = {},
) {
  const closed = options.close === false
    ? existing
    : await closeOverdueForSubject(existing.id, now, existing);
  if (!closed) return null;

  const [history, records] = await Promise.all([
    prisma.subjectHistory.findMany({
      where: { subjectId: existing.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, type: true, payload: true, createdAt: true, subjectEventId: true, subjectId: true },
    }),
    prisma.subjectRecord.findMany({
      where: { subjectId: existing.id },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);

  return {
    subject: { ...closed, records },
    activeWindow: getActiveWindow(closed.startDate, closed.kpiTypePeriod, now),
    events: [],
    history,
  };
}

subjectRoutes.get("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);
  const detail = await subjectDetail(existing);
  return c.json(detail);
});

subjectRoutes.get("/:id/events", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  await closeOverdueForSubject(existing.id, new Date(), existing);
  const events = await prisma.subjectEvent.findMany({
    where: { subjectId: existing.id },
    orderBy: { periodStart: "desc" },
    take: 100,
  });
  return c.json({ events });
});

subjectRoutes.patch("/:id/events/:eventId", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = eventPatchSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const event = await prisma.subjectEvent.findFirst({
    where: { id: c.req.param("eventId"), subjectId: existing.id },
  });
  if (!event) return c.json({ error: "Period not found" }, 404);

  const kpiSnapshot = parsed.data.kpi ?? event.kpiSnapshot;
  const progress = parsed.data.progress ?? event.progress;
  if (kpiSnapshot === event.kpiSnapshot && progress === event.progress) {
    return c.json({ event, currentStreak: existing.currentStreak });
  }
  const status = progress >= kpiSnapshot ? "finish" : "miss";

  const { updated, currentStreak } = await prisma.$transaction(async (tx) => {
    const updated = await tx.subjectEvent.update({
      where: { id: event.id },
      data: { kpiSnapshot, progress, status },
    });
    const { currentStreak } = await recomputeCurrentStreak(tx, existing.id);
    await tx.subjectHistory.create({
      data: {
        subjectId: existing.id,
        type: "kpi_change",
        subjectEventId: event.id,
        payload: {
          oldKpi: event.kpiSnapshot,
          newKpi: kpiSnapshot,
          oldProgress: event.progress,
          newProgress: progress,
          oldStatus: event.status,
          newStatus: status,
          periodStart: event.periodStart.toISOString(),
        },
      },
    });
    return { updated, currentStreak };
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ event: updated, currentStreak });
});

subjectRoutes.patch("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = updateSubjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

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
      isPriority: parsed.data.isPriority ?? existing.isPriority,
      nextCloseAt: nextCloseAtFor(
        startDate,
        parsed.data.kpiTypePeriod ?? existing.kpiTypePeriod,
      ),
      ...recordWriteData(parsed.data, existing),
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

  invalidateUserReads(c.get("user").id);
  const detail = await subjectDetail(subject);
  return c.json(detail);
});

subjectRoutes.delete("/:id", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);
  await prisma.subject.delete({ where: { id: existing.id } });
  invalidateUserReads(c.get("user").id);
  return c.json({ ok: true });
});

subjectRoutes.put("/:id/progress", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = progressSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const closed = await closeOverdueForSubject(existing.id, new Date(), existing);
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

  invalidateUserReads(c.get("user").id);
  const detail = await subjectDetail(
    { ...subject, currentProgress },
    new Date(),
    { close: false },
  );
  return c.json(detail);
});

subjectRoutes.post("/:id/records", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const parsed = createRecordSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const date = parseStartDate(parsed.data.date) ?? new Date(parsed.data.date);
  if (Number.isNaN(date.getTime())) return c.json({ error: "Invalid date" }, 400);

  await prisma.subjectRecord.create({
    data: {
      subjectId: existing.id,
      date,
      recordNumber: parsed.data.recordNumber,
    },
  });

  invalidateUserReads(c.get("user").id);
  const detail = await subjectDetail(existing, new Date(), { close: false });
  return c.json(detail, 201);
});

subjectRoutes.delete("/:id/records/:recordId", async (c) => {
  const existing = await ownedSubject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Subject not found" }, 404);

  const record = await prisma.subjectRecord.findFirst({
    where: { id: c.req.param("recordId"), subjectId: existing.id },
  });
  if (!record) return c.json({ error: "Record not found" }, 404);

  await prisma.subjectRecord.delete({ where: { id: record.id } });
  invalidateUserReads(c.get("user").id);
  const detail = await subjectDetail(existing, new Date(), { close: false });
  return c.json(detail);
});
