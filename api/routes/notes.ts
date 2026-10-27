import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthUser } from "../auth.ts";
import { invalidateUserReads } from "../cache.ts";
import { prisma } from "../db.ts";

const subjectIdsSchema = z.array(z.string().min(1)).max(50);

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(20000).optional(),
  subjectIds: subjectIdsSchema.optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().max(20000).optional(),
  subjectIds: subjectIdsSchema.optional(),
});

const subjectSelect = { id: true, name: true, icon: true, projectId: true, project: { select: { name: true } } } as const;

const noteInclude = {
  subjects: { include: { subject: { select: subjectSelect } } },
} as const;

function uniqueIds(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toNoteDto(note: {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  subjects: Array<{
    subject: {
      id: string;
      name: string;
      icon: string | null;
      projectId: string;
      project: { name: string };
    };
  }>;
}) {
  const subjects = note.subjects.map((item) => ({
    id: item.subject.id,
    name: item.subject.name,
    icon: item.subject.icon,
    projectId: item.subject.projectId,
    projectName: item.subject.project.name,
  }));
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    subjectIds: subjects.map((subject) => subject.id),
    subjects,
  };
}

export const noteRoutes = new Hono<{ Variables: { user: AuthUser } }>();
noteRoutes.use("*", authMiddleware);

async function ownedNote(userId: string, noteId: string) {
  return await prisma.note.findFirst({
    where: { id: noteId, userId },
    include: noteInclude,
  });
}

async function ownedSubjectIds(userId: string, subjectIds: string[]) {
  const unique = uniqueIds(subjectIds);
  if (unique.length === 0) return [];
  const subjects = await prisma.subject.findMany({
    where: { project: { userId }, id: { in: unique } },
    select: { id: true },
  });
  if (subjects.length !== unique.length) return null;
  return unique;
}

noteRoutes.get("/", async (c) => {
  const notes = await prisma.note.findMany({
    where: { userId: c.get("user").id },
    include: noteInclude,
    orderBy: { updatedAt: "desc" },
  });
  return c.json({ notes: notes.map(toNoteDto) });
});

noteRoutes.post("/", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const subjectIds = await ownedSubjectIds(c.get("user").id, parsed.data.subjectIds ?? []);
  if (!subjectIds) return c.json({ error: "Subject not found" }, 404);

  const note = await prisma.note.create({
    data: {
      userId: c.get("user").id,
      title: parsed.data.title,
      body: parsed.data.body ?? "",
      subjects: {
        create: subjectIds.map((subjectId) => ({ subjectId })),
      },
    },
    include: noteInclude,
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ note: toNoteDto(note) }, 201);
});

noteRoutes.patch("/:id", async (c) => {
  const existing = await ownedNote(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Note not found" }, 404);

  const parsed = updateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  if (parsed.data.subjectIds !== undefined) {
    const subjectIds = await ownedSubjectIds(c.get("user").id, parsed.data.subjectIds);
    if (!subjectIds) return c.json({ error: "Subject not found" }, 404);
    await prisma.$transaction([
      prisma.noteSubject.deleteMany({ where: { noteId: existing.id } }),
      ...(subjectIds.length > 0
        ? [
          prisma.noteSubject.createMany({
            data: subjectIds.map((subjectId) => ({ noteId: existing.id, subjectId })),
          }),
        ]
        : []),
    ]);
  }

  const note = await prisma.note.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title ?? existing.title,
      body: parsed.data.body ?? existing.body,
    },
    include: noteInclude,
  });

  invalidateUserReads(c.get("user").id);
  return c.json({ note: toNoteDto(note) });
});

noteRoutes.delete("/:id", async (c) => {
  const existing = await ownedNote(c.get("user").id, c.req.param("id"));
  if (!existing) return c.json({ error: "Note not found" }, 404);
  await prisma.note.delete({ where: { id: existing.id } });
  invalidateUserReads(c.get("user").id);
  return c.json({ ok: true });
});
