"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import type { DashboardStats } from "@/lib/types";

export function StatCards({ summary }: { summary: DashboardStats["summary"] }) {
  const { t } = useI18n();
  const items = [
    { label: t("dashboard.onTrack"), value: `${summary.onTrack}`, hint: t("dashboard.onTrackHint") },
    { label: t("dashboard.atRisk"), value: `${summary.atRisk}`, hint: t("dashboard.atRiskHint") },
    { label: t("dashboard.streaks"), value: `${summary.streakCount}`, hint: t("dashboard.streaksHint") },
    {
      label: t("dashboard.average"),
      value: `${Math.round(summary.averageProgress)}%`,
      hint: summary.hitRate == null ? t("dashboard.averageHint") : t("dashboard.hitRate", { rate: summary.hitRate }),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
