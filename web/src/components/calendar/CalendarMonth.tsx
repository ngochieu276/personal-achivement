"use client";

import { projectTone } from "@/components/calendar/calendarStyles";
import { localeTag, useI18n } from "@/i18n";
import {
  addDays,
  occurrencesOnDay,
  sameDay,
  startOfMonth,
  visibleRange,
  weekdayLabel,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const MAX_CHIPS = 3;

export function CalendarMonth({
  cursor,
  occurrences,
  onDayClick,
  onSlotClick,
  onEventClick,
  onMoreClick,
}: {
  cursor: Date;
  occurrences: CalendarOccurrence[];
  onDayClick: (day: Date) => void;
  onSlotClick: (day: Date) => void;
  onEventClick: (item: CalendarOccurrence) => void;
  onMoreClick: (day: Date, items: CalendarOccurrence[]) => void;
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const { from, to } = visibleRange("month", cursor);
  const days: Date[] = [];
  for (let day = new Date(from); day < to; day = addDays(day, 1)) days.push(new Date(day));
  const headers = days.slice(0, 7);
  const today = new Date();
  const month = startOfMonth(cursor);

  return (
    <div className="flex min-h-[40rem] flex-1 flex-col overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {headers.map((day) => (
          <div key={day.toISOString()} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {weekdayLabel(day, tag, "short")}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = sameDay(day, today);
          const items = occurrencesOnDay(occurrences, day).sort(
            (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
          );
          const shown = items.slice(0, MAX_CHIPS);
          const extra = items.length - shown.length;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-0 cursor-pointer border-b border-r p-1 last:border-r-0",
                !inMonth && "bg-muted/30",
              )}
              onClick={() => onSlotClick(day)}
            >
              <button
                type="button"
                className={cn(
                  "mb-1 ml-auto flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-primary text-primary-foreground",
                  !inMonth && !isToday && "text-muted-foreground",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onDayClick(day);
                }}
              >
                {day.getDate()}
              </button>
              <div className="space-y-0.5">
                {shown.map((item) => (
                  <button
                    key={`${item.task.id}-${item.startsAt.toISOString()}`}
                    type="button"
                    className={cn(
                      "block w-full truncate rounded border px-1 py-0.5 text-left text-[11px] leading-tight",
                      projectTone(item.task.projectId),
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEventClick(item);
                    }}
                  >
                    {item.startsAt.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })} {item.task.title}
                  </button>
                ))}
                {extra > 0 ? (
                  <button
                    type="button"
                    className="w-full rounded px-1 py-0.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted/80"
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoreClick(day, items);
                    }}
                  >
                    {t("calendar.more", { count: extra })}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
