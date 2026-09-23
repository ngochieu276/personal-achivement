import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { iconSchema, normalizeIcon } from "../icon.ts";
import { projectInclude, projectNavInclude, toGroupDto, toProjectDto } from "../serialize.ts";

const groupIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(48)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, "ID must be letters, numbers, _ or -");

const createGroupSchema = z.object({
  id: groupIdSchema,
  name: z.string().trim().min(1).max(120),
  icon: iconSchema,
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  icon: iconSchema,
}).refine(
  (value) => value.name !== undefined || value.icon !== undefined,
  { message: "name or icon is required" },
);

const addProjectSchema = z.object({
  projectId: z.string().min(1).optional(),
  projectIds: z.array(z.string().min(1)).optional(),
}).refine(
  (value) => Boolean(value.projectId) || (value.projectIds?.length ?? 0) > 0,
  { message: "projectId or projectIds is required" },
);

export const groupRoutes = new Hono<{ Variables: { user: AuthUser } }>();
groupRoutes.use("*", authMiddleware);

async function ownedGroup(userId: string, groupId: string) {
  return await prisma.group.findFirst({
    where: { id: groupId, userId },
  });
}

groupRoutes.get("/", async (c) => {
  const userId = c.get("user").id;
  const [groups, projects] = await Promise.all([
    prisma.group.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: {
        projects: {
          include: { project: { include: projectNavInclude } },
        },
      },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: projectNavInclude,
    }),
  ]);

  return c.json({
    groups: groups.map(toGroupDto),
    ungrouped: projects
      .filter((project) => project.groups.length === 0)
      .map(toProjectDto),
  });
});

groupRoutes.post("/", async (c) => {
  const parsed = createGroupSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const userId = c.get("user").id;
  const existing = await prisma.group.findUnique({ where: { id: parsed.data.id } });
  if (existing) {
    return c.json({ error: "Group ID already exists" }, 409);
  }

  const group = await prisma.group.create({
    data: {
      id: parsed.data.id,
      name: parsed.data.name,
      icon: normalizeIcon(parsed.data.icon) ?? null,
      userId,
    },
  });
  return c.json({ group: { ...group, projects: [] } }, 201);
});

groupRoutes.get("/:id", async (c) => {
  const group = await prisma.group.findFirst({
    where: { id: c.req.param("id"), userId: c.get("user").id },
    include: {
      projects: {
        include: { project: { include: projectInclude } },
      },
    },
  });
  if (!group) return c.json({ error: "Group not found" }, 404);
  return c.json({ group: toGroupDto(group) });
});

groupRoutes.patch("/:id", async (c) => {
  const parsed = updateGroupSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const existing = await ownedGroup(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Group not found" }, 404);

  const group = await prisma.group.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name ?? existing.name,
      icon: parsed.data.icon === undefined ? existing.icon : normalizeIcon(parsed.data.icon),
    },
  });
  return c.json({ group });
});

groupRoutes.delete("/:id", async (c) => {
  const existing = await ownedGroup(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Group not found" }, 404);
  await prisma.group.delete({ where: { id: existing.id } });
  return c.json({ ok: true });
});

groupRoutes.post("/:id/projects", async (c) => {
  const existing = await ownedGroup(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Group not found" }, 404);

  const parsed = addProjectSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const projectIds = [...new Set([
    ...(parsed.data.projectIds ?? []),
    ...(parsed.data.projectId ? [parsed.data.projectId] : []),
  ])];

  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds }, userId: c.get("user").id },
    select: { id: true },
  });
  if (projects.length !== projectIds.length) {
    return c.json({ error: "Project not found" }, 404);
  }

  await prisma.projectGroup.createMany({
    data: projects.map((project) => ({ projectId: project.id, groupId: existing.id })),
    skipDuplicates: true,
  });
  return c.json({ ok: true });
});

groupRoutes.delete("/:id/projects/:projectId", async (c) => {
  const existing = await ownedGroup(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Group not found" }, 404);
  await prisma.projectGroup.deleteMany({
    where: { groupId: existing.id, projectId: c.req.param("projectId") },
  });
  return c.json({ ok: true });
});
