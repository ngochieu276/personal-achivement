"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import {
  ACTIVITY_LEVELS,
  activityLevel,
  activityTotal,
  activityWeeks,
} from "@/lib/dashboard";
import type { DashboardActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function ActivityHeatmap() {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const query = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => api<DashboardActivity>("/stats/activity"),
    staleTime: 60_000,
  });

  const weeks = useMemo(
    () => (query.data ? activityWeeks(query.data) : []),
    [query.data],
  );
  const total = query.data ? activityTotal(query.data) : 0;
  const weekdayLabels = useMemo(
    () =>
      WEEKDAYS.map((offset) => {
        const date = new Date(Date.UTC(2024, 0, 1 + offset));
        return new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: "UTC" }).format(date);
      }),
    [tag],
  );
  const monthLabels = useMemo(() => monthMarks(weeks, tag), [tag, weeks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.activityTitle")}</CardTitle>
        <CardDescription>
          {query.data ? t("dashboard.activityDesc", { count: total }) : t("dashboard.loading")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <Skeleton className="h-36 w-full" />
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t("dashboard.error")}</p>
        ) : weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.activityEmpty")}</p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto pb-1">
              <div className="inline-flex gap-2">
                <div className="flex w-8 shrink-0 flex-col justify-between pt-5 text-[10px] leading-3 text-muted-foreground">
                  {weekdayLabels.map((label, index) => (
                    <span key={label} className={cn(![0, 2, 4].includes(index) && "invisible")}>
                      {label}
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="mb-1 grid gap-[3px] text-[10px] text-muted-foreground"
                    style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}
                  >
                    {monthLabels.map((label, index) => (
                      <span key={`${label}-${index}`} className="truncate">
                        {label}
                      </span>
                    ))}
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <div
                      className="grid gap-[3px]"
                      style={{
                        gridTemplateRows: "repeat(7, 11px)",
                        gridAutoFlow: "column",
                        gridAutoColumns: "11px",
                      }}
                    >
                      {weeks.flatMap((week) =>
                        week.map((cell) => {
                          const level = activityLevel(cell.count);
                          const label = new Intl.DateTimeFormat(tag, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(`${cell.date}T00:00:00.000Z`));
                          return (
                            <Tooltip key={cell.date}>
                              <TooltipTrigger asChild>
                                <div
                                  className="h-[11px] w-full min-w-[11px] rounded-[2px]"
                                  style={{ backgroundColor: ACTIVITY_LEVELS[level] }}
                                  aria-label={t("dashboard.activityOn", { count: cell.count, date: label })}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("dashboard.activityOn", { count: cell.count, date: label })}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }),
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
              <span>{t("dashboard.activityLess")}</span>
              {ACTIVITY_LEVELS.map((color) => (
                <span
                  key={color}
                  className="h-[11px] w-[11px] rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span>{t("dashboard.activityMore")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function monthMarks(weeks: ReturnType<typeof activityWeeks>, locale: string) {
  const labels: string[] = [];
  let last = "";
  for (const [index, week] of weeks.entries()) {
    const named =
      week.find((cell) => new Date(`${cell.date}T00:00:00.000Z`).getUTCDate() === 1) ??
      (index === 0 ? week[0] : null);
    if (!named) {
      labels.push("");
      continue;
    }
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
      new Date(`${named.date}T00:00:00.000Z`),
    );
    if (month === last) {
      labels.push("");
    } else {
      labels.push(month);
      last = month;
    }
  }
  return labels;
}
