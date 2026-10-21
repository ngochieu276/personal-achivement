import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { HistoryLine } from "@/components/subjects/SubjectExtras";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n";
import { groupActivitiesByDay } from "@/lib/activities";
import { api } from "@/lib/api";
import { formatTime, unitLabel } from "@/lib/format";
import { EntityIcon } from "@/lib/icons";
import type { ActivitiesPage as ActivitiesResponse, ActivityItem, ActivityRange } from "@/lib/types";

export function ActivitiesPage() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<ActivityRange>("week");
  const feedQuery = useInfiniteQuery({
    queryKey: ["activities", range],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ range });
      if (pageParam) params.set("cursor", pageParam);
      return api<ActivitiesResponse>(`/activities?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const next: ActivityItem[] = [];
    for (const page of feedQuery.data?.pages ?? []) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        next.push(item);
      }
    }
    return next;
  }, [feedQuery.data]);
  const days = useMemo(() => groupActivitiesByDay(items), [items, locale]);

  return (
    <Screen>
      <PageHeader
        eyebrow={t("activities.log")}
        title={t("activities.title")}
        subtitle={<Text className="mt-2 text-sm text-muted-foreground">{t("activities.subtitle")}</Text>}
        actions={<AccountMenu />}
      />
      <Select
        value={range}
        onChange={setRange}
        options={[
          { value: "week", label: t("activities.thisWeek") },
          { value: "month", label: t("activities.pastMonth") },
        ]}
      />
      {feedQuery.isLoading ? <Text className="text-muted-foreground">{t("activities.loading")}</Text> : null}
      {feedQuery.isError ? <EmptyState title={t("activities.error")} /> : null}
      {!feedQuery.isLoading && days.length === 0 ? (
        <EmptyState
          title={t("activities.emptyTitle")}
          description={range === "week" ? t("activities.emptyWeek") : t("activities.emptyMonth")}
        />
      ) : (
        days.map((day) => (
          <View key={day.dayKey} className="gap-2">
            <Text className="font-serif text-lg text-foreground">{day.label}</Text>
            {day.items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </View>
        ))
      )}
      {feedQuery.hasNextPage ? (
        <Button
          variant="outline"
          loading={feedQuery.isFetchingNextPage}
          onPress={() => void feedQuery.fetchNextPage()}
        >
          {t("activities.loadingMore")}
        </Button>
      ) : items.length > 0 ? (
        <Text className="text-center text-sm text-muted-foreground">{t("activities.endRange")}</Text>
      ) : null}
    </Screen>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const unit = unitLabel(item.subject.kpiType);
  return (
    <View className="flex-row gap-3">
      <Text className="w-14 text-xs text-muted-foreground">{formatTime(item.createdAt)}</Text>
      <View className="flex-1 border-l-2 border-border pl-3">
        <Link href={`/subjects/${item.subject.id}`} asChild>
          <Pressable className="flex-row items-center gap-1">
            <EntityIcon name={item.subject.icon} size={14} />
            <Text className="flex-1 text-sm font-medium text-foreground">
              {item.subject.name} · {item.subject.projectName}
            </Text>
          </Pressable>
        </Link>
        <HistoryLine item={item} unit={unit} />
      </View>
    </View>
  );
}
