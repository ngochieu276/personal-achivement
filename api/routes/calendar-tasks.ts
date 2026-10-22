import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { invalidateUserReads } from "../cache.ts";
import { prisma } from "../db.ts";
import { Prisma } from "../generated/prisma/client.ts";

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

const projectIdsShape = {
  projectId: z.string().min(1).optional(),
  projectIds: z.array(z.string().min(1)).optional(),
};

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  recurrence: recurrenceSchema.nullable().optional(),
  ...projectIdsShape,
}).refine(
  (value) => Boolean(value.projectId) || (value.projectIds?.length ?? 0) > 0,
  { message: "projectId or projectIds is required" },
);

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  startsAt: z.string().min(1).optional(),
  endsAt: z.string().min(1).optional(),
  recurrence: recurrenceSchema.nullable().optional(),
  ...projectIdsShape,
}).refine(
  (value) => value.projectIds === undefined || value.projectIds.length > 0,
  { message: "projectIds must not be empty" },
);

const projectSelect = { id: true, name: true, icon: true } as const;

const taskInclude = {
  projects: { include: { project: { select: projectSelect } } },
} as const;

function parseInstant(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function uniqueIds(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function requestedProjectIds(data: { projectId?: string; projectIds?: string[] }) {
  return uniqueIds([
    ...(data.projectIds ?? []),
    ...(data.projectId ? [data.projectId] : []),
  ]);
}

function toCalendarTaskDto(task: {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  recurrence: unknown;
  createdAt: Date;
  projects: Array<{ project: { id: string; name: string; icon: string | null } }>;
}) {
  const projects = task.projects.map((item) => item.project);
  return {
    id: task.id,
    title: task.title,
    startsAt: task.startsAt,
    endsAt: task.endsAt,
    recurrence: task.recurrence,
    createdAt: task.createdAt,
    projectIds: projects.map((project) => project.id),
    projects,
    projectId: projects[0]?.id ?? "",
    project: projects[0] ?? null,
  };
}

export const calendarTaskRoutes = new Hono<{ Variables: { user: AuthUser } }>();
calendarTaskRoutes.use("*", authMiddleware);

async function ownedTask(userId: string, taskId: string) {
  return await prisma.calendarTask.findFirst({
    where: { id: taskId, projects: { some: { project: { userId } } } },
    include: taskInclude,
  });
}

async function ownedProjectIds(userId: string, projectIds: string[]) {
  const unique = uniqueIds(projectIds);
  if (unique.length === 0) return null;
  const projects = await prisma.project.findMany({
    where: { userId, id: { in: unique } },
    select: { id: true },
  });
  if (projects.length !== unique.length) return null;
  return unique;
}

calendarTaskRoutes.get("/", async (c) => {
  const from = parseInstant(c.req.query("from") ?? "");
  const to = parseInstant(c.req.query("to") ?? "");
  if (!from || !to || to <= from) {
    return c.json({ error: "from and to query params are required" }, 400);
  }

  const rows = await prisma.calendarTask.findMany({
    where: {
      projects: { some: { project: { userId: c.get("user").id } } },
      startsAt: { lt: to },
    },
    include: taskInclude,
    orderBy: { startsAt: "asc" },
  });

  const calendarTasks = rows
    .filter((task) => {
      if (task.recurrence == null) return task.endsAt > from;
      return true;
    })
    .map(toCalendarTaskDto);

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

  const projectIds = await ownedProjectIds(c.get("user").id, requestedProjectIds(parsed.data));
  if (!projectIds) return c.json({ error: "Project not found" }, 404);

  const calendarTask = await prisma.calendarTask.create({
    data: {
      title: parsed.data.title,
      startsAt,
      endsAt,
      recurrence: parsed.data.recurrence ?? undefined,
      projects: {
        create: projectIds.map((projectId) => ({ projectId })),
      },
    },
    include: taskInclude,
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ calendarTask: toCalendarTaskDto(calendarTask) }, 201);
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

  const requested = requestedProjectIds(parsed.data);
  if (requested.length > 0) {
    const projectIds = await ownedProjectIds(c.get("user").id, requested);
    if (!projectIds) return c.json({ error: "Project not found" }, 404);
    await prisma.$transaction([
      prisma.calendarTaskProject.deleteMany({ where: { calendarTaskId: existing.id } }),
      prisma.calendarTaskProject.createMany({
        data: projectIds.map((projectId) => ({ calendarTaskId: existing.id, projectId })),
      }),
    ]);
  }

  const calendarTask = await prisma.calendarTask.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title ?? existing.title,
      startsAt,
      endsAt,
      ...(parsed.data.recurrence === undefined
        ? {}
        : { recurrence: parsed.data.recurrence ?? Prisma.DbNull }),
    },
    include: taskInclude,
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ calendarTask: toCalendarTaskDto(calendarTask) });
});

calendarTaskRoutes.delete("/:id", async (c) => {
  const existing = await ownedTask(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Task not found" }, 404);
  await prisma.calendarTask.delete({ where: { id: existing.id } });
  invalidateUserReads(c.get("user").id);
  return c.json({ ok: true });
});
