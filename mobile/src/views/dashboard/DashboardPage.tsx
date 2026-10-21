import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export function DashboardPage() {
  const { t } = useI18n();
  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardStats>("/stats/dashboard"),
  });

  if (statsQuery.isLoading) {
    return (
      <Screen>
        <PageHeader eyebrow={t("dashboard.overview")} title={t("dashboard.title")} actions={<AccountMenu />} />
        <Text className="text-muted-foreground">{t("dashboard.loading")}</Text>
      </Screen>
    );
  }
  if (!statsQuery.data) {
    return (
      <Screen>
        <EmptyState title={t("dashboard.error")} />
      </Screen>
    );
  }

  const { summary } = statsQuery.data;
  const cards = [
    { title: t("dashboard.onTrack"), value: summary.onTrack, hint: t("dashboard.onTrackHint") },
    { title: t("dashboard.atRisk"), value: summary.atRisk, hint: t("dashboard.atRiskHint") },
    { title: t("dashboard.streaks"), value: summary.streakCount, hint: t("dashboard.streaksHint") },
    {
      title: t("dashboard.average"),
      value: `${Math.round(summary.averageProgress * 100)}%`,
      hint: t("dashboard.averageHint"),
    },
  ];

  return (
    <Screen>
      <PageHeader
        eyebrow={t("dashboard.overview")}
        title={t("dashboard.title")}
        subtitle={
          <Text className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.subjectCount", { count: summary.subjectCount })}
            {summary.hitRate != null ? ` · ${t("dashboard.hitRate", { rate: Math.round(summary.hitRate * 100) })}` : ""}
          </Text>
        }
        actions={<AccountMenu />}
      />
      <View className="flex-row flex-wrap gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="min-w-[45%] flex-1">
            <CardDescription>{card.title}</CardDescription>
            <CardTitle>{String(card.value)}</CardTitle>
            <CardDescription>{card.hint}</CardDescription>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
