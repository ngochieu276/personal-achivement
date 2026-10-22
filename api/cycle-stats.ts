import { prisma } from "./db.ts";

export type CycleStats = {
  finishedCycles: number;
  totalCycles: number;
};

export async function cycleStatsForSubjects(subjectIds: string[]) {
  const map = new Map<string, CycleStats>();
  for (const id of subjectIds) {
    map.set(id, { finishedCycles: 0, totalCycles: 0 });
  }
  if (subjectIds.length === 0) return map;

  const rows = await prisma.subjectEvent.groupBy({
    by: ["subjectId", "status"],
    where: { subjectId: { in: subjectIds } },
    _count: { _all: true },
  });

  for (const row of rows) {
    const current = map.get(row.subjectId) ?? { finishedCycles: 0, totalCycles: 0 };
    current.totalCycles += row._count._all;
    if (row.status === "finish") current.finishedCycles += row._count._all;
    map.set(row.subjectId, current);
  }
  return map;
}

export function withCycleStats<T extends { id: string }>(subject: T, stats?: CycleStats) {
  return {
    ...subject,
    finishedCycles: stats?.finishedCycles ?? 0,
    totalCycles: stats?.totalCycles ?? 0,
  };
}
