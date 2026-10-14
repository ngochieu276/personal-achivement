"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarMonth } from "@/components/calendar/CalendarMonth";
import { CalendarTaskDialog } from "@/components/calendar/CalendarTaskDialog";
import { CalendarTimeGrid } from "@/components/calendar/CalendarTimeGrid";
import { Button } from "@/components/ui/button";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import {
  daysInRange,
  expandAll,
  startOfDay,
  stepCursor,
  titleForView,
  visibleRange,
} from "@/lib/calendar";
import type { CalendarOccurrence } from "@/lib/calendar";
import type { CalendarTask, CalendarView, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = {
  task?: CalendarTask | null;
  startsAt: Date;
  endsAt: Date;
};

const VIEWS: CalendarView[] = ["day", "fourDays", "week", "month"];

export function CalendarPage() {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [draft, setDraft] = useState<Draft | null>(null);

  const range = useMemo(() => visibleRange(view, cursor), [cursor, view]);
  const days = useMemo(() => daysInRange(range.from, range.to), [range.from, range.to]);

  const tasksQuery = useQuery({
    queryKey: ["calendar-tasks", range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      api<{ calendarTasks: CalendarTask[] }>(
        `/calendar-tasks?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`,
      ),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });

  const occurrences = useMemo(
    () => expandAll(tasksQuery.data?.calendarTasks ?? [], range.from, range.to),
    [range.from, range.to, tasksQuery.data?.calendarTasks],
  );

  const viewLabels: Record<CalendarView, string> = {
    day: t("calendar.viewDay"),
    fourDays: t("calendar.viewFourDays"),
    week: t("calendar.viewWeek"),
    month: t("calendar.viewMonth"),
  };

  function openCreate(startsAt: Date, endsAt: Date) {
    setDraft({ startsAt, endsAt });
  }

  function openEdit(item: CalendarOccurrence) {
    setDraft({
      task: item.task,
      startsAt: new Date(item.task.startsAt),
      endsAt: new Date(item.task.endsAt),
    });
  }

  function createOnDay(day: Date) {
    const start = startOfDay(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    openCreate(start, end);
  }

  function createAtHour(day: Date, hour: number) {
    const start = startOfDay(day);
    start.setHours(hour, 0, 0, 0);
    openCreate(start, new Date(start.getTime() + 60 * 60 * 1000));
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[36rem] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setCursor(new Date())}>
          {t("calendar.today")}
        </Button>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("calendar.previous")}
            onClick={() => setCursor((current) => stepCursor(view, current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("calendar.next")}
            onClick={() => setCursor((current) => stepCursor(view, current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h1 className="min-w-0 flex-1 font-serif text-2xl">{titleForView(view, cursor, tag)}</h1>
        <div className="flex flex-wrap rounded-md border p-0.5">
          {VIEWS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={view === item ? "secondary" : "ghost"}
              className={cn("h-8", view === item && "shadow-none")}
              onClick={() => setView(item)}
            >
              {viewLabels[item]}
            </Button>
          ))}
        </div>
      </div>

      {tasksQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("calendar.loading")}</p>
      ) : null}
      {tasksQuery.isError ? (
        <p className="text-sm text-destructive">{tasksQuery.error.message}</p>
      ) : null}

      {view === "month" ? (
        <CalendarMonth
          cursor={cursor}
          occurrences={occurrences}
          onDayClick={(day) => {
            setCursor(day);
            setView("day");
          }}
          onSlotClick={createOnDay}
          onEventClick={openEdit}
        />
      ) : (
        <CalendarTimeGrid
          days={days}
          occurrences={occurrences}
          onSlotClick={createAtHour}
          onEventClick={openEdit}
        />
      )}

      {draft ? (
        <CalendarTaskDialog
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
          task={draft.task}
          startsAt={draft.startsAt}
          endsAt={draft.endsAt}
          projects={projectsQuery.data?.projects ?? []}
        />
      ) : null}
    </div>
  );
}
