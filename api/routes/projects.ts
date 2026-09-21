import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { iconSchema, normalizeIcon } from "../icon.ts";
import {
  alignCycleStart,
  closeOverdueForSubject,
  getActiveWindow,
  parseStartDate,
} from "../period.ts";
import { projectInclude, toProjectDto } from "../serialize.ts";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: iconSchema,
  groupIds: z.array(z.string().min(1)).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  icon: iconSchema,
  groupIds: z.array(z.string().min(1)).optional(),
}).refine(
  (value) =>
    value.name !== undefined || value.groupIds !== undefined || value.icon !== undefined,
  { message: "name, icon, or groupIds is required" },
);

const createSubjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: iconSchema,
  kpi: z.number().positive(),
  kpiTypePeriod: z.enum(["day", "week", "twoWeek", "month"]),
  kpiType: z.enum(["totalTime", "totalRepeat"]),
  startDate: z.string().min(1).optional(),
  link: z.string().url().optional().or(z.literal("")),
});

export const projectRoutes = new Hono<{ Variables: { user: AuthUser } }>();
projectRoutes.use("*", authMiddleware);

async function ownedProject(userId: string, projectId: string) {
  return await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}

async function ownedGroupIds(userId: string, groupIds: string[]) {
  const unique = [...new Set(groupIds)];
  const groups = await prisma.group.findMany({
    where: { userId, id: { in: unique } },
    select: { id: true },
  });
  if (groups.length !== unique.length) return null;
  return unique;
}

async function projectDto(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });
  return project ? toProjectDto(project) : null;
}

projectRoutes.get("/", async (c) => {
  const user = c.get("user");
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: projectInclude,
  });
  return c.json({
    projects: projects.map(toProjectDto),
  });
});

projectRoutes.post("/", async (c) => {
  const parsed = createProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const userId = c.get("user").id;
  const groupIds = parsed.data.groupIds
    ? await ownedGroupIds(userId, parsed.data.groupIds)
    : [];
  if (groupIds === null) return c.json({ error: "Group not found" }, 404);

  const created = await prisma.project.create({
    data: {
      name: parsed.data.name,
      icon: normalizeIcon(parsed.data.icon) ?? null,
      userId,
      groups: {
        create: groupIds.map((groupId) => ({ groupId })),
      },
    },
  });
  return c.json({ project: await projectDto(created.id) }, 201);
});

projectRoutes.get("/:id", async (c) => {
  const existing = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Project not found" }, 404);
  return c.json({ project: await projectDto(existing.id) });
});

projectRoutes.patch("/:id", async (c) => {
  const parsed = updateProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const existing = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Project not found" }, 404);

  const userId = c.get("user").id;
  let groupIds: string[] | null | undefined;
  if (parsed.data.groupIds) {
    groupIds = await ownedGroupIds(userId, parsed.data.groupIds);
    if (groupIds === null) return c.json({ error: "Group not found" }, 404);
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.name !== undefined || parsed.data.icon !== undefined) {
      await tx.project.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name ?? existing.name,
          icon: parsed.data.icon === undefined ? existing.icon : normalizeIcon(parsed.data.icon),
        },
      });
    }
    if (groupIds) {
      await tx.projectGroup.deleteMany({ where: { projectId: existing.id } });
      if (groupIds.length > 0) {
        await tx.projectGroup.createMany({
          data: groupIds.map((groupId) => ({ projectId: existing.id, groupId })),
        });
      }
    }
  });

  return c.json({ project: await projectDto(existing.id) });
});

projectRoutes.delete("/:id", async (c) => {
  const existing = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Project not found" }, 404);
  await prisma.project.delete({ where: { id: existing.id } });
  return c.json({ ok: true });
});

projectRoutes.get("/:id/subjects", async (c) => {
  const project = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!project) return c.json({ error: "Project not found" }, 404);

  const subjects = await prisma.subject.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const payload = [];
  for (const subject of subjects) {
    const closed = (await closeOverdueForSubject(subject.id, now)) ?? subject;
    payload.push({
      ...closed,
      activeWindow: getActiveWindow(closed.startDate, closed.kpiTypePeriod, now),
    });
  }
  return c.json({ subjects: payload });
});

projectRoutes.post("/:id/subjects", async (c) => {
  const project = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!project) return c.json({ error: "Project not found" }, 404);

  const parsed = createSubjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const rawStart = parseStartDate(
    parsed.data.startDate ?? new Date().toISOString().slice(0, 10),
  );
  if (!rawStart) {
    return c.json({ error: "Invalid startDate" }, 400);
  }
  const startDate = alignCycleStart(rawStart, parsed.data.kpiTypePeriod);

  const subject = await prisma.subject.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      icon: normalizeIcon(parsed.data.icon) ?? null,
      kpi: parsed.data.kpi,
      kpiTypePeriod: parsed.data.kpiTypePeriod,
      kpiType: parsed.data.kpiType,
      startDate,
      link: parsed.data.link ? parsed.data.link : null,
    },
  });

  return c.json({
    subject: {
      ...subject,
      activeWindow: getActiveWindow(subject.startDate, subject.kpiTypePeriod),
    },
  }, 201);
});
