import type { KpiTypePeriod } from "@/lib/types";
import { t } from "@/i18n";

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfIsoWeek(date: Date) {
  const day = startOfLocalDay(date);
  const weekday = day.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  day.setDate(day.getDate() - offset);
  return day;
}

export function alignCycleStart(date: Date, period: KpiTypePeriod) {
  const day = startOfLocalDay(date);
  switch (period) {
    case "day":
      return day;
    case "week":
      return startOfIsoWeek(day);
    case "twoWeek": {
      const monday = startOfIsoWeek(day);
      const epoch = startOfIsoWeek(new Date(1970, 0, 5));
      const diffDays = Math.round((monday.getTime() - epoch.getTime()) / 86_400_000);
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex % 2 !== 0) {
        monday.setDate(monday.getDate() - 7);
      }
      return monday;
    }
    case "month":
      return new Date(day.getFullYear(), day.getMonth(), 1);
  }
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function cycleStartHint(period: KpiTypePeriod) {
  const keys = {
    day: "cycle.day",
    week: "cycle.week",
    twoWeek: "cycle.twoWeek",
    month: "cycle.month",
  } as const;
  return t(keys[period]);
}
