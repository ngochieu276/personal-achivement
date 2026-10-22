"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import { cyclePointLabel } from "@/lib/dashboard";
import type { DashboardCyclePeriod, DashboardCycleRange, DashboardCycles } from "@/lib/types";
import { cn } from "@/lib/utils";

const PERIODS: DashboardCyclePeriod[] = ["day", "week", "month"];
const RANGES: DashboardCycleRange[] = ["month", "3months", "6months"];
const TOTAL_COLOR = "#0ea5e9";
const FINISH_COLOR = "#166534";

export function CycleChart() {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const [period, setPeriod] = useState<DashboardCyclePeriod>("week");
  const [range, setRange] = useState<DashboardCycleRange>("3months");

  const query = useQuery({
    queryKey: ["dashboard", "cycles", period, range],
    queryFn: () =>
      api<DashboardCycles>(`/stats/cycles?period=${period}&range=${range}`),
    staleTime: 60_000,
  });

  const points = useMemo(
    () =>
      (query.data?.points ?? []).map((point) => ({
        ...point,
        label: cyclePointLabel(point.start, period, tag),
      })),
    [period, query.data?.points, tag],
  );
  const hasData = points.some((point) => point.total > 0);
  const yMax = useMemo(() => {
    const peak = points.reduce((max, point) => Math.max(max, point.total, point.finish), 0);
    return peak > 0 ? Math.ceil(peak * 1.15) : 1;
  }, [points]);

  const periodLabels: Record<DashboardCyclePeriod, string> = {
    day: t("dashboard.periodDay"),
    week: t("dashboard.periodWeek"),
    month: t("dashboard.periodMonth"),
  };
  const rangeLabels: Record<DashboardCycleRange, string> = {
    month: t("dashboard.rangeMonth"),
    "3months": t("dashboard.range3Months"),
    "6months": t("dashboard.range6Months"),
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>{t("dashboard.cyclesTitle")}</CardTitle>
          <CardDescription>{t("dashboard.cyclesDesc")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterGroup
            value={period}
            options={PERIODS.map((id) => ({ id, label: periodLabels[id] }))}
            onChange={setPeriod}
          />
          <FilterGroup
            value={range}
            options={RANGES.map((id) => ({ id, label: rangeLabels[id] }))}
            onChange={setRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : query.isError ? (
          <p className="text-sm text-destructive">{t("dashboard.error")}</p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.cyclesEmpty")}</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cycle-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TOTAL_COLOR} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={TOTAL_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cycle-finish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FINISH_COLOR} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={FINISH_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#88bdf2" opacity={0.35} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6a89a7", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, yMax]}
                  tick={{ fill: "#6a89a7", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value, name) => [
                    value ?? 0,
                    name === "finish" ? t("dashboard.cycleFinish") : t("dashboard.cycleTotal"),
                  ]}
                  contentStyle={{
                    borderRadius: "0.85rem",
                    borderColor: "#d5e8f8",
                    background: "rgba(247, 251, 255, 0.96)",
                    boxShadow: "0 12px 30px rgba(56, 73, 89, 0.08)",
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "finish" ? t("dashboard.cycleFinish") : t("dashboard.cycleTotal")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={TOTAL_COLOR}
                  fill="url(#cycle-total)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: TOTAL_COLOR }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#f7fbff" }}
                />
                <Area
                  type="monotone"
                  dataKey="finish"
                  stroke={FINISH_COLOR}
                  fill="url(#cycle-finish)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: FINISH_COLOR }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#f7fbff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-md border border-border bg-card p-0.5">
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={value === option.id}
          className={cn("h-8 px-3", value === option.id && "bg-muted")}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
