import type { CalendarRecurrence, CalendarTask, CalendarView } from "@/lib/types";

export type CalendarOccurrence = {
  task: CalendarTask;
  startsAt: Date;
  endsAt: Date;
};

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

export function startOfWeekSunday(date: Date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function visibleRange(view: CalendarView, cursor: Date) {
  if (view === "day") {
    const from = startOfDay(cursor);
    return { from, to: addDays(from, 1) };
  }
  if (view === "fourDays") {
    const from = startOfDay(cursor);
    return { from, to: addDays(from, 4) };
  }
  if (view === "week") {
    const from = startOfWeekSunday(cursor);
    return { from, to: addDays(from, 7) };
  }
  const monthStart = startOfMonth(cursor);
  const from = startOfWeekSunday(monthStart);
  const lastInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const to = addDays(startOfWeekSunday(lastInMonth), 7);
  return { from, to };
}

export function daysInRange(from: Date, to: Date) {
  const days: Date[] = [];
  for (let day = startOfDay(from); day < to; day = addDays(day, 1)) {
    days.push(new Date(day));
  }
  return days;
}

export function stepCursor(view: CalendarView, cursor: Date, direction: -1 | 1) {
  if (view === "day") return addDays(cursor, direction);
  if (view === "fourDays") return addDays(cursor, direction * 4);
  if (view === "week") return addDays(cursor, direction * 7);
  return addMonths(startOfMonth(cursor), direction);
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function atTimeOnDate(source: Date, day: Date) {
  const next = new Date(day);
  next.setHours(source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
  return next;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function expandOccurrences(task: CalendarTask, from: Date, to: Date): CalendarOccurrence[] {
  const seriesStart = new Date(task.startsAt);
  const duration = new Date(task.endsAt).getTime() - seriesStart.getTime();
  if (duration <= 0) return [];
  const rec = task.recurrence;

  function pushIfVisible(start: Date, into: CalendarOccurrence[]) {
    if (start < seriesStart) return;
    const end = new Date(start.getTime() + duration);
    if (end > from && start < to) into.push({ task, startsAt: start, endsAt: end });
  }

  if (!rec) {
    const items: CalendarOccurrence[] = [];
    pushIfVisible(seriesStart, items);
    return items;
  }

  const items: CalendarOccurrence[] = [];
  if (rec.frequency === "daily") {
    let cursor = atTimeOnDate(seriesStart, startOfDay(seriesStart));
    while (cursor < from) cursor = addDays(cursor, 1);
    if (cursor > from) {
      const prev = addDays(cursor, -1);
      if (new Date(prev.getTime() + duration) > from) pushIfVisible(prev, items);
    }
    while (cursor < to) {
      pushIfVisible(cursor, items);
      cursor = addDays(cursor, 1);
    }
    return items;
  }

  if (rec.frequency === "weekly") {
    let day = startOfDay(seriesStart);
    while (day.getDay() !== rec.weekday) day = addDays(day, 1);
    let cursor = atTimeOnDate(seriesStart, day);
    while (addDays(cursor, 7) < from) cursor = addDays(cursor, 7);
    while (cursor < to) {
      pushIfVisible(cursor, items);
      cursor = addDays(cursor, 7);
    }
    return items;
  }

  for (
    let cursor = new Date(seriesStart.getFullYear(), seriesStart.getMonth(), 1);
    cursor < to;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  ) {
    if (rec.monthDay <= daysInMonth(cursor.getFullYear(), cursor.getMonth())) {
      pushIfVisible(atTimeOnDate(seriesStart, new Date(cursor.getFullYear(), cursor.getMonth(), rec.monthDay)), items);
    }
  }
  return items;
}

export function expandAll(tasks: CalendarTask[], from: Date, to: Date) {
  return tasks.flatMap((task) => expandOccurrences(task, from, to));
}

export function occurrencesOnDay(items: CalendarOccurrence[], day: Date) {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  return items.filter((item) => item.endsAt > from && item.startsAt < to);
}

export function clipToDay(item: CalendarOccurrence, day: Date) {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  return {
    ...item,
    startsAt: item.startsAt < from ? from : item.startsAt,
    endsAt: item.endsAt > to ? to : item.endsAt,
  };
}

export function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export type LaidOutOccurrence = CalendarOccurrence & {
  col: number;
  colCount: number;
  top: number;
  height: number;
};

export function layoutDayEvents(items: CalendarOccurrence[], day: Date, hourHeight: number): LaidOutOccurrence[] {
  const from = startOfDay(day);
  const to = addDays(from, 1);
  const clipped = items
    .map((item) => clipToDay(item, day))
    .filter((item) => item.endsAt > from && item.startsAt < to)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.endsAt.getTime() - b.endsAt.getTime());

  const columns: Date[] = [];
  const placed: { item: CalendarOccurrence; col: number }[] = [];
  for (const item of clipped) {
    let col = columns.findIndex((end) => end.getTime() <= item.startsAt.getTime());
    if (col < 0) {
      col = columns.length;
      columns.push(item.endsAt);
    } else {
      columns[col] = item.endsAt;
    }
    placed.push({ item, col });
  }
  const colCount = Math.max(1, columns.length);
  return placed.map(({ item, col }) => {
    const startMin = minutesFromMidnight(item.startsAt);
    const endMin = Math.max(startMin + 15, minutesFromMidnight(item.endsAt));
    return {
      ...item,
      col,
      colCount,
      top: (startMin / 60) * hourHeight,
      height: ((endMin - startMin) / 60) * hourHeight,
    };
  });
}

export function toDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function hourLabel(hour: number, locale: string) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(date);
}

export function weekdayLabel(date: Date, locale: string, width: "short" | "long" = "short") {
  return new Intl.DateTimeFormat(locale, { weekday: width }).format(date);
}

export function titleForView(view: CalendarView, cursor: Date, locale: string) {
  if (view === "month") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor);
  }
  if (view === "day") {
    return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric" }).format(cursor);
  }
  const { from, to } = visibleRange(view, cursor);
  const last = addDays(to, -1);
  const startLabel = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(from);
  const endLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(last);
  return `${startLabel} – ${endLabel}`;
}

export function recurrenceFromStart(frequency: CalendarRecurrence["frequency"] | "none", start: Date): CalendarRecurrence | null {
  if (frequency === "none") return null;
  if (frequency === "daily") return { frequency: "daily" };
  if (frequency === "weekly") return { frequency: "weekly", weekday: start.getDay() };
  return { frequency: "monthly", monthDay: start.getDate() };
}

export function calendarTaskProjects(task: CalendarTask) {
  if (task.projects?.length) return task.projects;
  return task.project ? [task.project] : [];
}

export function calendarTaskProjectIds(task: CalendarTask) {
  if (task.projectIds?.length) return task.projectIds;
  return task.projectId ? [task.projectId] : [];
}

export function calendarTaskToneId(task: CalendarTask) {
  return calendarTaskProjectIds(task)[0] ?? "";
}

export function calendarTaskProjectLabel(task: CalendarTask) {
  return calendarTaskProjects(task).map((project) => project.name).join(", ");
}
