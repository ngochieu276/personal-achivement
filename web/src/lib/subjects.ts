import type { KpiTypePeriod, Subject } from "@/lib/types";
import { t } from "@/i18n";

export const PERIOD_ORDER: KpiTypePeriod[] = ["day", "week", "twoWeek", "month"];

export function periodGroupLabel(period: KpiTypePeriod) {
  const keys = {
    day: "period.groupDay",
    week: "period.groupWeek",
    twoWeek: "period.groupTwoWeek",
    month: "period.groupMonth",
  } as const;
  return t(keys[period]);
}

export function compareSubjects(left: Subject, right: Subject) {
  const leftOrder = left.orderIndex;
  const rightOrder = right.orderIndex;
  const leftHasOrder = leftOrder != null;
  const rightHasOrder = rightOrder != null;
  if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) return leftOrder - rightOrder;
  if (leftHasOrder !== rightHasOrder) return leftHasOrder ? -1 : 1;
  if (left.isPriority !== right.isPriority) return left.isPriority ? -1 : 1;
  return left.name.localeCompare(right.name);
}

export function groupSubjectsByPeriod(subjects: Subject[]) {
  return PERIOD_ORDER.map((period) => ({
    period,
    subjects: subjects
      .filter((subject) => subject.kpiTypePeriod === period)
      .sort(compareSubjects),
  })).filter((group) => group.subjects.length > 0);
}

export function progressPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return (current / target) * 100;
}

export function exceedAmount(current: number, target: number) {
  return current > target ? current - target : 0;
}

export function latestRecordNumber(subject: Subject) {
  return subject.records?.[0]?.recordNumber ?? null;
}

export function visibleProjectSubjects(subjects: Subject[]) {
  return subjects.filter((subject) => subject.status !== "pending");
}

export function groupArchivedByProject(subjects: Subject[]) {
  const groups = new Map<
    string,
    { projectId: string; name: string; icon?: string | null; subjects: Subject[] }
  >();
  for (const subject of subjects) {
    const projectId = subject.project?.id ?? subject.projectId;
    const current = groups.get(projectId);
    if (current) {
      current.subjects.push(subject);
      continue;
    }
    groups.set(projectId, {
      projectId,
      name: subject.project?.name ?? "",
      icon: subject.project?.icon,
      subjects: [subject],
    });
  }
  return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
}
