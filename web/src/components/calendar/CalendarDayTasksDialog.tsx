"use client";

import { projectTone } from "@/components/calendar/calendarStyles";
import { FormDialog } from "@/components/shared/FormDialog";
import { localeTag, useI18n } from "@/i18n";
import type { CalendarOccurrence } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function CalendarDayTasksDialog({
  open,
  onOpenChange,
  day,
  items,
  onEventClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Date;
  items: CalendarOccurrence[];
  onEventClick: (item: CalendarOccurrence) => void;
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const dateLabel = day.toLocaleDateString(tag, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("calendar.dayTasks", { date: dateLabel })}
      variant="scroll"
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("calendar.emptyDay")}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const projectName = item.task.project?.name;
            return (
              <button
                key={`${item.task.id}-${item.startsAt.toISOString()}`}
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm",
                  projectTone(item.task.projectId),
                )}
                onClick={() => onEventClick(item)}
              >
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {item.startsAt.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.task.title}</span>
                  {projectName ? (
                    <span className="block truncate text-xs text-muted-foreground">{projectName}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </FormDialog>
  );
}
