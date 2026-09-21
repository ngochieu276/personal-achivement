import type { KpiTypePeriod } from "@/lib/types";

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function startOfIsoWeekUtc(date: Date) {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

export function alignCycleStart(date: Date, period: KpiTypePeriod) {
  const day = startOfUtcDay(date);
  switch (period) {
    case "day":
      return day;
    case "week":
      return startOfIsoWeekUtc(day);
    case "twoWeek": {
      const monday = startOfIsoWeekUtc(day);
      const epoch = Date.UTC(1970, 0, 5);
      const diffDays = Math.floor((monday.getTime() - epoch) / 86_400_000);
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex % 2 !== 0) {
        monday.setUTCDate(monday.getUTCDate() - 7);
      }
      return monday;
    }
    case "month":
      return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
  }
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function cycleStartHint(period: KpiTypePeriod) {
  switch (period) {
    case "day":
      return "Starts at the beginning of that day.";
    case "week":
      return "Starts on Monday of that week.";
    case "twoWeek":
      return "Starts on Monday of the two-week cycle.";
    case "month":
      return "Starts on the first day of that month.";
  }
}
