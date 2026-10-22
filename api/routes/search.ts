import { Hono } from "hono";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { prisma } from "../db.ts";

const LIMIT = 8;

export const searchRoutes = new Hono<{ Variables: { user: AuthUser } }>();
searchRoutes.use("*", authMiddleware);

searchRoutes.get("/", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q) return c.json({ projects: [], subjects: [] });

  const userId = c.get("user").id;
  const nameFilter = { contains: q.slice(0, 80), mode: "insensitive" as const };

  const [projects, subjects] = await Promise.all([
    prisma.project.findMany({
      where: { userId, name: nameFilter },
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.subject.findMany({
      where: { project: { userId }, name: nameFilter },
      select: {
        id: true,
        name: true,
        icon: true,
        projectId: true,
        project: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
  ]);

  return c.json({
    projects,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      projectId: subject.projectId,
      projectName: subject.project.name,
    })),
  });
});
