import type { KpiType, KpiTypePeriod } from "@/lib/types";
import { t, localeTag } from "@/i18n";

export function periodLabel(period: KpiTypePeriod) {
  const keys = {
    day: "period.day",
    week: "period.week",
    twoWeek: "period.twoWeek",
    month: "period.month",
  } as const;
  return t(keys[period]);
}

export function unitLabel(kpiType: KpiType) {
  return kpiType === "totalTime" ? t("unit.min") : t("unit.reps");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(localeTag(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatPeriodRange(start: string, end: string) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(localeTag(), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat(localeTag(), {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function localDayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayHeading(dayKey: string) {
  const today = localDayKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDayKey(yesterdayDate);
  if (dayKey === today) return t("time.today");
  if (dayKey === yesterday) return t("time.yesterday");
  return formatDate(`${dayKey}T12:00:00`);
}

export function remainingLabel(endIso: string) {
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return t("time.periodEnding");
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return t("time.hoursLeft", { count: Math.max(1, hours) });
  const days = Math.floor(hours / 24);
  return t("time.daysLeft", { count: days });
}

export function fileKind(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image" as const;
  if (mimeType === "application/pdf") return "pdf" as const;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "sheet" as const;
  if (mimeType.includes("word") || mimeType.includes("document")) return "doc" as const;
  return "file" as const;
}
