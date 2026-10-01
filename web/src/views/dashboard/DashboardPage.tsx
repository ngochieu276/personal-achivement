"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCards } from "@/components/dashboard/StatCards";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export function DashboardPage() {
  const { t } = useI18n();
  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardStats>("/stats/dashboard"),
    staleTime: 60_000,
  });

  if (statsQuery.isLoading) {
    return (
      <Page>
        <PageHeader eyebrow={t("dashboard.overview")} title={t("dashboard.title")} />
        <PageLoading label={t("dashboard.loading")} />
      </Page>
    );
  }

  if (!statsQuery.data) {
    return <ListPlaceholder variant="error" label={t("dashboard.error")} />;
  }

  const { summary } = statsQuery.data;

  return (
    <Page>
      <PageHeader
        eyebrow={t("dashboard.overview")}
        title={t("dashboard.title")}
        subtitle={
          <p className="mt-2 text-muted-foreground">
            {t("dashboard.subjectCount", { count: summary.subjectCount })}
          </p>
        }
      />
      <StatCards summary={summary} />
    </Page>
  );
}
