import type { KpiType, KpiTypePeriod } from "@/lib/types";

export const periodLabels: Record<KpiTypePeriod, string> = {
  day: "Per day",
  week: "Per week",
  twoWeek: "Per 2 weeks",
  month: "Per month",
};

export function unitLabel(kpiType: KpiType) {
  return kpiType === "totalTime" ? "min" : "reps";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function remainingLabel(endIso: string) {
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return "Period ending";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(1, hours)}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}
