"use client";

import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { CycleChart } from "@/components/dashboard/CycleChart";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/i18n";

export function DashboardPage() {
  const { t } = useI18n();

  return (
    <Page>
      <PageHeader eyebrow={t("dashboard.overview")} title={t("dashboard.title")} />
      <ActivityHeatmap />
      <CycleChart />
    </Page>
  );
}
