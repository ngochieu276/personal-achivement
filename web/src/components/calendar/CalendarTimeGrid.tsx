"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HOUR_HEIGHT, projectTone } from "@/components/calendar/calendarStyles";
import { localeTag, useI18n } from "@/i18n";
import {
  calendarTaskToneId,
  hourLabel,
  layoutDayEvents,
  minutesFromMidnight,
  occurrencesOnDay,
  sameDay,
  weekdayLabel,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export function CalendarTimeGrid({
  days,
  occurrences,
  onSlotClick,
  onEventClick,
}: {
  days: Date[];
  occurrences: CalendarOccurrence[];
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (item: CalendarOccurrence) => void;
}) {
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const today = new Date();
  const [now, setNow] = useState(() => new Date());
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 7 * HOUR_HEIGHT });
  }, [days[0]?.toDateString()]);

  const columns = useMemo(
    () =>
      days.map((day) => ({
        day,
        events: layoutDayEvents(occurrencesOnDay(occurrences, day), day, HOUR_HEIGHT),
      })),
    [days, occurrences],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
      <div className="grid border-b" style={{ gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((day) => {
          const isToday = sameDay(day, today);
          return (
            <div key={day.toISOString()} className="border-l px-2 py-2 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {weekdayLabel(day, tag, "short")}
              </p>
              <p
                className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-serif",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: `4.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-2 text-xs text-muted-foreground"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                {hour === 0 ? "" : hourLabel(hour, tag)}
              </div>
            ))}
          </div>
          {columns.map(({ day, events }) => {
            const isToday = sameDay(day, today);
            const nowTop = (minutesFromMidnight(now) / 60) * HOUR_HEIGHT;
            return (
              <div key={day.toISOString()} className="relative border-l" style={{ height: HOUR_HEIGHT * 24 }}>
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    className="absolute inset-x-0 border-t border-border/80"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(day, hour)}
                    aria-label={`${day.toDateString()} ${hourLabel(hour, tag)}`}
                  />
                ))}
                {isToday ? (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                    <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-miss" />
                    <span className="h-px flex-1 bg-miss" />
                  </div>
                ) : null}
                {events.map((item) => (
                  <button
                    key={`${item.task.id}-${item.startsAt.toISOString()}`}
                    type="button"
                    className={cn(
                      "absolute z-20 overflow-hidden rounded border px-1.5 py-1 text-left text-xs leading-tight",
                      projectTone(calendarTaskToneId(item.task)),
                    )}
                    style={{
                      top: item.top,
                      height: Math.max(item.height, 20),
                      left: `calc(${(item.col / item.colCount) * 100}% + 4px)`,
                      width: `calc(${100 / item.colCount}% - 8px)`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEventClick(item);
                    }}
                  >
                    <span className="block font-medium">{item.task.title}</span>
                    <span className="block text-[11px] opacity-80">
                      {item.startsAt.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
