import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { cyclePointLabel } from "@/lib/dashboard";
import { colors } from "@/lib/theme";
import type { DashboardCyclePeriod, DashboardCycleRange, DashboardCycles } from "@/lib/types";

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
    queryFn: () => api<DashboardCycles>(`/stats/cycles?period=${period}&range=${range}`),
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
  const totalLine = useMemo(
    () => points.map((point) => ({ value: point.total, label: point.label })),
    [points],
  );
  const finishLine = useMemo(
    () => points.map((point) => ({ value: point.finish })),
    [points],
  );
  const yMax = Math.max(1, ...points.map((point) => Math.max(point.total, point.finish)));

  return (
    <Card>
      <CardTitle>{t("dashboard.cyclesTitle")}</CardTitle>
      <CardDescription>{t("dashboard.cyclesDesc")}</CardDescription>
      <Select
        className="mt-3"
        value={period}
        onChange={setPeriod}
        options={PERIODS.map((id) => ({
          value: id,
          label:
            id === "day"
              ? t("dashboard.periodDay")
              : id === "week"
                ? t("dashboard.periodWeek")
                : t("dashboard.periodMonth"),
        }))}
      />
      <Select
        className="mt-2"
        value={range}
        onChange={setRange}
        options={RANGES.map((id) => ({
          value: id,
          label:
            id === "month"
              ? t("dashboard.rangeMonth")
              : id === "3months"
                ? t("dashboard.range3Months")
                : t("dashboard.range6Months"),
        }))}
      />
      {query.isError ? (
        <Text className="mt-3 text-sm text-destructive">{t("dashboard.error")}</Text>
      ) : query.isLoading ? (
        <Text className="mt-3 text-sm text-muted-foreground">{t("dashboard.loading")}</Text>
      ) : !hasData ? (
        <Text className="mt-3 text-sm text-muted-foreground">{t("dashboard.cyclesEmpty")}</Text>
      ) : (
        <View className="mt-3">
          <LineChart
            data={totalLine}
            data2={finishLine}
            height={180}
            maxValue={Math.ceil(yMax * 1.15)}
            noOfSections={4}
            color={TOTAL_COLOR}
            color2={FINISH_COLOR}
            thickness={2.5}
            thickness2={2.5}
            startFillColor={TOTAL_COLOR}
            startFillColor2={FINISH_COLOR}
            endFillColor={TOTAL_COLOR}
            endFillColor2={FINISH_COLOR}
            startOpacity={0.22}
            startOpacity2={0.22}
            endOpacity={0.02}
            endOpacity2={0.02}
            areaChart
            hideDataPoints={false}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 9 }}
            hideRules={false}
            rulesColor={colors.border}
            curved
          />
          <Text className="mt-2 text-xs text-muted-foreground">
            {t("dashboard.cycleTotal")} / {t("dashboard.cycleFinish")}
          </Text>
        </View>
      )}
    </Card>
  );
}
