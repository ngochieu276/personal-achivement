import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { BackLink, EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { PeriodTimeline } from "@/components/subjects/SubjectExtras";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { unitLabel } from "@/lib/format";
import type { SubjectDetail, SubjectEventsResponse } from "@/lib/types";

export function SubjectTimelinePage() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detailQuery = useQuery({
    queryKey: ["subject", id],
    queryFn: () => api<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });
  const eventsQuery = useQuery({
    queryKey: ["subject-events", id],
    queryFn: () => api<SubjectEventsResponse>(`/subjects/${id}/events`),
    enabled: Boolean(id),
  });

  if (detailQuery.isLoading) {
    return (
      <Screen>
        <Text className="text-muted-foreground">{t("subjects.loading")}</Text>
      </Screen>
    );
  }
  if (!detailQuery.data) {
    return (
      <Screen>
        <EmptyState title={t("subjects.notFound")} />
      </Screen>
    );
  }

  const { subject } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);

  return (
    <Screen>
      <BackLink href={`/subjects/${subject.id}`} label={t("subjects.backToSubject")} />
      <PageHeader
        eyebrow={t("breadcrumb.timeline")}
        title={subject.name}
        icon={subject.icon}
        subtitle={<Text className="mt-2 text-sm text-muted-foreground">{t("subjects.timelineHint", { unit })}</Text>}
      />
      <Card>
        <CardTitle>{t("subjects.passingPeriods")}</CardTitle>
        <CardDescription>{t("subjects.passingDesc")}</CardDescription>
        {eventsQuery.isError ? (
          <Text className="mt-3 text-sm text-destructive">{t("subjects.loadPeriodsError")}</Text>
        ) : (
          <PeriodTimeline subjectId={subject.id} events={eventsQuery.data?.events ?? []} unit={unit} />
        )}
      </Card>
    </Screen>
  );
}
