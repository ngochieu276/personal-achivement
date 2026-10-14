import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { invalidateUserReads } from "../cache.ts";
import { prisma } from "../db.ts";

const recurrenceSchema = z.union([
  z.object({ frequency: z.literal("daily") }),
  z.object({
    frequency: z.literal("weekly"),
    weekday: z.number().int().min(0).max(6),
  }),
  z.object({
    frequency: z.literal("monthly"),
    monthDay: z.number().int().min(1).max(31),
  }),
]);

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  recurrence: recurrenceSchema.nullable().optional(),
});

const updateSchema = z.object({
  projectId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  startsAt: z.string().min(1).optional(),
  endsAt: z.string().min(1).optional(),
  recurrence: recurrenceSchema.nullable().optional(),
});

const projectSelect = { id: true, name: true, icon: true } as const;

function parseInstant(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const calendarTaskRoutes = new Hono<{ Variables: { user: AuthUser } }>();
calendarTaskRoutes.use("*", authMiddleware);

async function ownedTask(userId: string, taskId: string) {
  return await prisma.calendarTask.findFirst({
    where: { id: taskId, project: { userId } },
    include: { project: { select: projectSelect } },
  });
}

calendarTaskRoutes.get("/", async (c) => {
  const from = parseInstant(c.req.query("from") ?? "");
  const to = parseInstant(c.req.query("to") ?? "");
  if (!from || !to || to <= from) {
    return c.json({ error: "from and to query params are required" }, 400);
  }

  const rows = await prisma.calendarTask.findMany({
    where: {
      project: { userId: c.get("user").id },
      startsAt: { lt: to },
    },
    include: { project: { select: projectSelect } },
    orderBy: { startsAt: "asc" },
  });

  const calendarTasks = rows.filter((task) => {
    if (task.recurrence == null) return task.endsAt > from;
    return true;
  });

  return c.json({ calendarTasks });
});

calendarTaskRoutes.post("/", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const startsAt = parseInstant(parsed.data.startsAt);
  const endsAt = parseInstant(parsed.data.endsAt);
  if (!startsAt || !endsAt) return c.json({ error: "Invalid startsAt or endsAt" }, 400);
  if (endsAt <= startsAt) return c.json({ error: "endsAt must be after startsAt" }, 400);

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: c.get("user").id },
    select: projectSelect,
  });
  if (!project) return c.json({ error: "Project not found" }, 404);

  const calendarTask = await prisma.calendarTask.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      startsAt,
      endsAt,
      recurrence: parsed.data.recurrence ?? undefined,
    },
    include: { project: { select: projectSelect } },
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ calendarTask }, 201);
});

calendarTaskRoutes.patch("/:id", async (c) => {
  const existing = await ownedTask(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Task not found" }, 404);

  const parsed = updateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const startsAt = parsed.data.startsAt === undefined
    ? existing.startsAt
    : parseInstant(parsed.data.startsAt);
  const endsAt = parsed.data.endsAt === undefined
    ? existing.endsAt
    : parseInstant(parsed.data.endsAt);
  if (!startsAt || !endsAt) return c.json({ error: "Invalid startsAt or endsAt" }, 400);
  if (endsAt <= startsAt) return c.json({ error: "endsAt must be after startsAt" }, 400);

  let projectId = existing.projectId;
  if (parsed.data.projectId && parsed.data.projectId !== existing.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: c.get("user").id },
      select: { id: true },
    });
    if (!project) return c.json({ error: "Project not found" }, 404);
    projectId = project.id;
  }

  const calendarTask = await prisma.calendarTask.update({
    where: { id: existing.id },
    data: {
      projectId,
      title: parsed.data.title ?? existing.title,
      startsAt,
      endsAt,
      recurrence: parsed.data.recurrence === undefined ? existing.recurrence : parsed.data.recurrence,
    },
    include: { project: { select: projectSelect } },
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ calendarTask });
});

calendarTaskRoutes.delete("/:id", async (c) => {
  const existing = await ownedTask(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  await prisma.calendarTask.delete({ where: { id: existing.id } });
  invalidateUserReads(c.get("user").id);
  return c.json({ ok: true });
});
