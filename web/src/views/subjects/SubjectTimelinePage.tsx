"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PeriodTimeline } from "@/components/subjects/PeriodTimeline";
import { SubjectPageSkeleton } from "@/components/subjects/SubjectPageSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { unitLabel } from "@/lib/format";
import type { SubjectDetail, SubjectEventsResponse } from "@/lib/types";

export function SubjectTimelinePage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();

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
    return <SubjectPageSkeleton />;
  }
  if (!detailQuery.data) {
    return <ListPlaceholder variant="error" label={t("subjects.notFound")} />;
  }

  const { subject } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);
  const events = eventsQuery.data?.events ?? [];

  return (
    <Page>
      <BackLink to={`/subjects/${subject.id}`}>{t("subjects.backToSubject")}</BackLink>
      <PageHeader
        eyebrow={t("breadcrumb.timeline")}
        title={subject.name}
        icon={subject.icon}
        align="start"
        subtitle={
          <p className="mt-2 text-muted-foreground">
            {t("subjects.timelineHint", { unit })}
          </p>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("subjects.passingPeriods")}</CardTitle>
          <CardDescription>
            {t("subjects.passingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : eventsQuery.isError ? (
            <p className="text-sm text-destructive">{t("subjects.loadPeriodsError")}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("subjects.noClosedPeriods")}
            </p>
          ) : (
            <PeriodTimeline
              subjectId={subject.id}
              projectId={subject.projectId}
              events={events}
              unit={unit}
            />
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
