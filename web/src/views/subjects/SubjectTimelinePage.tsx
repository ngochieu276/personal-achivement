import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PeriodTimeline } from "@/components/subjects/PeriodTimeline";
import { SubjectPageSkeleton } from "@/components/subjects/SubjectPageSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { unitLabel } from "@/lib/format";
import type { SubjectDetail, SubjectEventsResponse } from "@/lib/types";

export function SubjectTimelinePage() {
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
    return <ListPlaceholder variant="error" label="Subject not found." />;
  }

  const { subject } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);
  const events = eventsQuery.data?.events ?? [];

  return (
    <Page>
      <BackLink to={`/subjects/${subject.id}`}>Back to subject</BackLink>
      <PageHeader
        eyebrow="Timeline"
        title={subject.name}
        icon={subject.icon}
        align="start"
        subtitle={
          <p className="mt-2 text-muted-foreground">
            Closed periods. Edit a period’s KPI or logged {unit} if you forgot to fill it in.
          </p>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Passing periods</CardTitle>
          <CardDescription>
            Newest first. Saving a period updates its result and the subject streak.
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
            <p className="text-sm text-destructive">Could not load closed periods.</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No closed periods yet. When a cycle ends, it shows up here so you can fill in a missed KPI or progress.
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
