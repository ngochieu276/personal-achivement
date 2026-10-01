"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ActivityDayGroup } from "@/components/activities/ActivityDayList";
import { ActivityFilters } from "@/components/activities/ActivityFilters";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { InfiniteScrollSentinel } from "@/components/shared/InfiniteScrollSentinel";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { groupActivitiesByDay } from "@/lib/activities";
import type {
  ActivitiesPage as ActivitiesResponse,
  ActivityItem,
  ActivityRange,
} from "@/lib/types";

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
    staleTime: 30_000,
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
  const hasMore = Boolean(feedQuery.hasNextPage);
  const isFetchingNextPage = feedQuery.isFetchingNextPage;
  const fetchNextPage = feedQuery.fetchNextPage;
  const loadMore = useCallback(() => {
    if (isFetchingNextPage || !hasMore) return;
    void fetchNextPage();
  }, [fetchNextPage, hasMore, isFetchingNextPage]);

  return (
    <Page>
      <PageHeader
        eyebrow={t("activities.log")}
        title={t("activities.title")}
        align="start"
        subtitle={
          <p className="mt-2 text-muted-foreground">
            {t("activities.subtitle")}
          </p>
        }
        actions={<ActivityFilters value={range} onChange={setRange} />}
      />

      {feedQuery.isLoading ? (
        <PageLoading label={t("activities.loading")} />
      ) : feedQuery.isError ? (
        <ListPlaceholder variant="error" label={t("activities.error")} />
      ) : days.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title={t("activities.emptyTitle")}
          description={range === "week" ? t("activities.emptyWeek") : t("activities.emptyMonth")}
        />
      ) : (
        <div className="space-y-8">
          {days.map((day) => (
            <ActivityDayGroup key={day.dayKey} label={day.label} items={day.items} />
          ))}
          <InfiniteScrollSentinel enabled={hasMore} onVisible={loadMore} />
          {feedQuery.isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              {t("activities.loadingMore")}
            </div>
          ) : null}
          {!hasMore && (feedQuery.data?.pages.length ?? 0) > 1 ? (
            <p className="text-center text-sm text-muted-foreground">{t("activities.endRange")}</p>
          ) : null}
        </div>
      )}
    </Page>
  );
}
