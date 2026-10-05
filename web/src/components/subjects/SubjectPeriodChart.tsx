"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PeriodWindow, Subject, SubjectEvent, SubjectEventsResponse } from "@/lib/types";

export type PeriodChartRange = "fourWeeks" | "threeMonths" | "sixMonths";

export function SubjectPeriodChart({
  subject,
  activeWindow,
  unit,
}: {
  subject: Subject;
  activeWindow: PeriodWindow;
  unit: string;
}) {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<PeriodChartRange>("fourWeeks");

  const eventsQuery = useQuery({
    queryKey: ["subject-events", subject.id],
    queryFn: () => api<SubjectEventsResponse>(`/subjects/${subject.id}/events`),
    staleTime: 30_000,
  });

  const points = useMemo(
    () =>
      chartPoints({
        events: eventsQuery.data?.events ?? [],
        subject,
        activeWindow,
        range,
      }),
    [activeWindow, eventsQuery.data?.events, locale, range, subject],
  );

  const yMax = useMemo(() => {
    const peak = points.reduce((max, point) => Math.max(max, point.actual, point.target), 0);
    return peak > 0 ? peak * 1.5 : 1;
  }, [points]);

  const filters: { id: PeriodChartRange; label: string }[] = [
    { id: "fourWeeks", label: t("subjects.chart4Weeks") },
    { id: "threeMonths", label: t("subjects.chart3Months") },
    { id: "sixMonths", label: t("subjects.chart6Months") },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{t("subjects.chartTitle")}</CardTitle>
          <CardDescription>{t("subjects.chartDesc")}</CardDescription>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={range === filter.id}
              className={cn("h-8 px-3", range === filter.id && "bg-muted")}
              onClick={() => setRange(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {eventsQuery.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : eventsQuery.isError ? (
          <p className="text-sm text-destructive">{t("subjects.loadPeriodsError")}</p>
        ) : points.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("subjects.chartEmpty")}</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88bdf2" opacity={0.45} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6a89a7", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#88bdf2" }}
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fill: "#6a89a7", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#88bdf2" }}
                  width={40}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${value ?? 0} ${unit}`,
                    name === "target" ? t("subjects.chartTarget") : t("subjects.chartActual"),
                  ]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "#88bdf2",
                    background: "#f7fbff",
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "target" ? t("subjects.chartTarget") : t("subjects.chartActual")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#6a89a7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function chartRangeStart(range: PeriodChartRange, now = new Date()) {
  if (range === "fourWeeks") {
    return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  }
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const back = range === "threeMonths" ? 2 : 5;
  return new Date(Date.UTC(year, month - back, 1));
}

function chartPoints({
  events,
  subject,
  activeWindow,
  range,
}: {
  events: SubjectEvent[];
  subject: Subject;
  activeWindow: PeriodWindow;
  range: PeriodChartRange;
}) {
  const from = chartRangeStart(range);
  const byStart = new Map<string, { start: string; target: number; actual: number; label: string }>();

  for (const event of events) {
    if (new Date(event.periodEnd) <= from) continue;
    byStart.set(event.periodStart, {
      start: event.periodStart,
      target: event.kpiSnapshot,
      actual: event.progress,
      label: formatTick(event.periodStart),
    });
  }

  if (new Date(activeWindow.end) > from && !byStart.has(activeWindow.start)) {
    byStart.set(activeWindow.start, {
      start: activeWindow.start,
      target: subject.kpi,
      actual: subject.currentProgress,
      label: formatTick(activeWindow.start),
    });
  }

  return [...byStart.values()].sort(
    (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
  );
}

function formatTick(value: string) {
  return new Intl.DateTimeFormat(localeTag(), {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
