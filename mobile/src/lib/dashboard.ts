import type { DashboardActivity, DashboardCyclePeriod } from "@/lib/types";

export type ActivityCell = {
  date: string;
  count: number;
};

export const ACTIVITY_LEVELS = ["#d5e8f8", "#bbf7d0", "#4ade80", "#22c55e", "#15803d"] as const;

export function activityLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function utcDay(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addUtcDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function activityWeeks(data: DashboardActivity) {
  const counts = new Map(data.days.map((day) => [day.date, day.count]));
  const start = utcDay(data.from);
  const last = utcDay(data.to);
  let end = last;
  while (end.getUTCDay() !== 0) end = addUtcDays(end, 1);
  const weeks: ActivityCell[][] = [];
  let week: ActivityCell[] = [];

  for (let day = new Date(start); day <= end; day = addUtcDays(day, 1)) {
    const key = dateKey(day);
    week.push({ date: key, count: day > last ? 0 : counts.get(key) ?? 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

export function activityTotal(data: DashboardActivity) {
  return data.days.reduce((sum, day) => sum + day.count, 0);
}

export function cyclePointLabel(start: string, period: DashboardCyclePeriod, locale: string) {
  const date = new Date(start);
  if (period === "month") {
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}
