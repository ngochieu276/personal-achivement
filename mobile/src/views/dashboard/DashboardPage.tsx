import { AccountMenu } from "@/components/layout/AccountMenu";
import { PageHeader, Screen } from "@/components/layout/Screen";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { CycleChart } from "@/components/dashboard/CycleChart";
import { useI18n } from "@/i18n";

export function DashboardPage() {
  const { t } = useI18n();

  return (
    <Screen>
      <PageHeader
        eyebrow={t("dashboard.overview")}
        title={t("dashboard.title")}
        actions={<AccountMenu />}
      />
      <ActivityHeatmap />
      <CycleChart />
    </Screen>
  );
}
