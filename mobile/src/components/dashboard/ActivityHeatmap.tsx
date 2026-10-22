import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { ACTIVITY_LEVELS, activityLevel, activityTotal, activityWeeks } from "@/lib/dashboard";
import type { DashboardActivity } from "@/lib/types";

export function ActivityHeatmap() {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const query = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => api<DashboardActivity>("/stats/activity"),
    staleTime: 60_000,
  });

  const weeks = useMemo(() => (query.data ? activityWeeks(query.data) : []), [query.data]);
  const total = query.data ? activityTotal(query.data) : 0;
  const weekdayLabels = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((offset) => {
        const date = new Date(Date.UTC(2024, 0, 1 + offset));
        return new Intl.DateTimeFormat(tag, { weekday: "short" }).format(date);
      }),
    [tag],
  );

  return (
    <Card>
      <CardTitle>{t("dashboard.activityTitle")}</CardTitle>
      <CardDescription>
        {query.data ? t("dashboard.activityDesc", { count: total }) : t("dashboard.loading")}
      </CardDescription>
      {query.isError ? (
        <Text className="mt-3 text-sm text-destructive">{t("dashboard.error")}</Text>
      ) : query.isLoading ? (
        <Text className="mt-3 text-sm text-muted-foreground">{t("dashboard.loading")}</Text>
      ) : weeks.length === 0 ? (
        <Text className="mt-3 text-sm text-muted-foreground">{t("dashboard.activityEmpty")}</Text>
      ) : (
        <View className="mt-3 gap-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-1">
              <View className="mr-1 justify-between py-0.5">
                {weekdayLabels.map((label, index) => (
                  <Text
                    key={label}
                    className="h-[11px] text-[8px] leading-[11px] text-muted-foreground"
                    style={{ opacity: [0, 2, 4].includes(index) ? 1 : 0 }}
                  >
                    {label.slice(0, 2)}
                  </Text>
                ))}
              </View>
              {weeks.map((week) => (
                <View key={week[0]?.date} className="gap-[3px]">
                  {week.map((cell) => (
                    <View
                      key={cell.date}
                      className="h-[11px] w-[11px] rounded-[2px]"
                      style={{ backgroundColor: ACTIVITY_LEVELS[activityLevel(cell.count)] }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <View className="flex-row items-center justify-end gap-1">
            <Text className="text-[10px] text-muted-foreground">{t("dashboard.activityLess")}</Text>
            {ACTIVITY_LEVELS.map((color) => (
              <View key={color} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
            ))}
            <Text className="text-[10px] text-muted-foreground">{t("dashboard.activityMore")}</Text>
          </View>
        </View>
      )}
    </Card>
  );
}
