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

export function groupSubjectsByPeriod(subjects: Subject[]) {
  return PERIOD_ORDER.map((period) => ({
    period,
    subjects: subjects
      .filter((subject) => subject.kpiTypePeriod === period)
      .sort((left, right) => {
        if (left.isPriority !== right.isPriority) return left.isPriority ? -1 : 1;
        return left.name.localeCompare(right.name);
      }),
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
