import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";
import {
  closeOverdueForSubject,
  getActiveWindow,
} from "../period.ts";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const createSubjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kpi: z.number().positive(),
  kpiTypePeriod: z.enum(["day", "week", "twoWeek", "month"]),
  kpiType: z.enum(["totalTime", "totalRepeat"]),
  startDate: z.string().min(1),
  link: z.string().url().optional().or(z.literal("")),
});

export const projectRoutes = new Hono<{ Variables: { user: AuthUser } }>();
projectRoutes.use("*", authMiddleware);

function parseStartDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function ownedProject(userId: string, projectId: string) {
  return await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}

projectRoutes.get("/", async (c) => {
  const user = c.get("user");
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subjects: true } } },
  });
  return c.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      subjectCount: project._count.subjects,
    })),
  });
});

projectRoutes.post("/", async (c) => {
  const parsed = createProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      userId: c.get("user").id,
    },
  });
  return c.json({ project }, 201);
});

projectRoutes.get("/:id", async (c) => {
  const project = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!project) return c.json({ error: "Project not found" }, 404);
  return c.json({ project });
});

projectRoutes.patch("/:id", async (c) => {
  const parsed = createProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const existing = await ownedProject(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Project not found" }, 404);

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: { name: parsed.data.name },
  });
  return c.json({ project });
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

  const startDate = parseStartDate(parsed.data.startDate);
  if (!startDate) {
    return c.json({ error: "Invalid startDate" }, 400);
  }

  const subject = await prisma.subject.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
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
