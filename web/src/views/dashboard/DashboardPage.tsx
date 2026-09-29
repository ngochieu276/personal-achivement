import { useQuery } from "@tanstack/react-query";
import { StatCards } from "@/components/dashboard/StatCards";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardStats>("/stats/dashboard"),
    staleTime: 60_000,
  });

  if (statsQuery.isLoading) {
    return (
      <Page>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <PageLoading label="Loading stats..." />
      </Page>
    );
  }

  if (!statsQuery.data) {
    return <ListPlaceholder variant="error" label="Could not load dashboard." />;
  }

  const { summary } = statsQuery.data;

  return (
    <Page>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle={
          <p className="mt-2 text-muted-foreground">
            {summary.subjectCount} subjects in the current cycle.
          </p>
        }
      />
      <StatCards summary={summary} />
    </Page>
  );
}
