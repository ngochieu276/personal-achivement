import { averageProgressPercent } from "./record.ts";

type ProjectSubjectProgress = {
  currentProgress: number;
  kpi: number;
};

type ProjectWithGroups = {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
  _count?: { subjects: number };
  subjects?: ProjectSubjectProgress[];
  groups: Array<{
    groupId: string;
    group: { id: string; name: string; icon: string | null };
  }>;
};

export const projectNavInclude = {
  groups: { include: { group: { select: { id: true, name: true, icon: true } } } },
} as const;

export const projectInclude = {
  _count: { select: { subjects: true } },
  subjects: { select: { currentProgress: true, kpi: true } },
  groups: { include: { group: { select: { id: true, name: true, icon: true } } } },
} as const;

export function toProjectDto(project: ProjectWithGroups) {
  return {
    id: project.id,
    name: project.name,
    icon: project.icon,
    createdAt: project.createdAt,
    subjectCount: project._count?.subjects ?? project.subjects?.length ?? 0,
    averageProgress: averageProgressPercent(project.subjects ?? []),
    groupIds: project.groups.map((item) => item.groupId),
    groups: project.groups.map((item) => ({
      id: item.group.id,
      name: item.group.name,
      icon: item.group.icon,
    })),
  };
}

export function toGroupDto(group: {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
  projects?: Array<{ project: ProjectWithGroups }>;
}) {
  return {
    id: group.id,
    name: group.name,
    icon: group.icon,
    createdAt: group.createdAt,
    projects: (group.projects ?? []).map((item) => toProjectDto(item.project)),
  };
}
