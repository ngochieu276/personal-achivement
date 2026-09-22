import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AddProgressForm } from "@/components/AddProgressForm";
import { BackLink } from "@/components/BackLink";
import { ListPlaceholder } from "@/components/ListPlaceholder";
import { Page, PageHeader } from "@/components/PageHeader";
import { SubjectPageSkeleton } from "@/components/SubjectPageSkeleton";
import { ProgressBar } from "@/components/ProgressBar";
import { ResourceLink } from "@/components/ResourceLink";
import { SetProgressForm } from "@/components/SetProgressForm";
import { RemainingBadge, StreakBadge } from "@/components/StreakBadge";
import { SubjectDocuments } from "@/components/SubjectDocuments";
import { SubjectFormDialog } from "@/components/SubjectFormDialog";
import { KpiDoneList, SubjectHistory } from "@/components/SubjectHistory";
import { SubjectNote } from "@/components/SubjectNote";
import { subjectToFormValues, type SubjectFormValues } from "@/components/SubjectForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDate, periodLabels, unitLabel } from "@/lib/format";
import { betterDirectionLabels, typeOfRecordLabels } from "@/lib/record";
import type { SubjectDetail } from "@/lib/types";

export function SubjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState("");
  const [editing, setEditing] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["subject", id],
    queryFn: () => api<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setProgress(String(detailQuery.data.subject.currentProgress));
  }, [detailQuery.data]);

  const saveProgress = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${id}/progress`, {
        method: "PUT",
        body: JSON.stringify({ currentProgress: Number(progress) }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
    },
  });

  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      setEditing(false);
    },
  });

  const updateExtras = useMutation({
    mutationFn: (body: { note?: string | null; documents?: string[] }) =>
      api<SubjectDetail>(`/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
    },
  });

  if (detailQuery.isLoading) {
    return <SubjectPageSkeleton />;
  }
  if (!detailQuery.data) {
    return <ListPlaceholder variant="error" label="Subject not found." />;
  }

  const { subject, activeWindow, history } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);

  return (
    <Page>
      <BackLink to={`/projects/${subject.projectId}`}>Back to project</BackLink>
      <PageHeader
        eyebrow="Subject"
        title={subject.name}
        icon={subject.icon}
        align="start"
        onEdit={() => setEditing(true)}
        editLabel="Edit subject"
        subtitle={
          <p className="mt-2 text-muted-foreground">
            {periodLabels[subject.kpiTypePeriod]} · cycle started {formatDate(subject.startDate)}
            {subject.typeOfRecord
              ? ` · ${typeOfRecordLabels[subject.typeOfRecord]}${subject.recordNumber != null ? ` ${subject.recordNumber}` : ""}${subject.betterDirection ? ` (${betterDirectionLabels[subject.betterDirection]})` : ""}`
              : ""}
          </p>
        }
        actions={
          <>
            <StreakBadge streak={subject.currentStreak} variant="labeled" />
            <RemainingBadge end={activeWindow.end} />
          </>
        }
      />

      <SubjectFormDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit subject"
        formKey={subject.id}
        initial={subjectToFormValues(subject)}
        submitLabel="Save subject"
        pending={updateSubject.isPending}
        error={updateSubject.error?.message}
        onSubmit={(values) => updateSubject.mutate(values)}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>This period</CardTitle>
            <CardDescription>
                {periodLabels[subject.kpiTypePeriod]} · {subject.kpi} {unit}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar current={subject.currentProgress} target={subject.kpi} size="lg" />
            <p className="text-sm text-muted-foreground">
              {subject.currentProgress} / {subject.kpi} {unit}
            </p>
            <SetProgressForm
              unit={unit}
              value={progress}
              onChange={setProgress}
              onSubmit={() => saveProgress.mutate()}
              pending={saveProgress.isPending}
              error={saveProgress.error?.message}
            />
            <div className="space-y-2">
              <Label>Add {unit} done</Label>
              <AddProgressForm
                subjectId={subject.id}
                projectId={subject.projectId}
                kpiType={subject.kpiType}
              />
            </div>
            {subject.link ? <ResourceLink href={subject.link} variant="full" /> : null}
          </CardContent>
        </Card>
          <SubjectNote
            value={subject.note ?? ""}
            pending={updateExtras.isPending}
            error={updateExtras.error?.message}
            onSave={(note) => updateExtras.mutate({ note })}
          />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>This period events</CardTitle>
          <CardDescription>KPI done events logged in the current window.</CardDescription>
        </CardHeader>
        <CardContent>
          <KpiDoneList history={history} periodStart={activeWindow.start} unit={unit} />
        </CardContent>
      </Card>

      <SubjectDocuments
        documents={subject.documents ?? []}
        pending={updateExtras.isPending}
        error={updateExtras.error?.message}
        onChange={(documents) => updateExtras.mutate({ documents })}
      />

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>KPI done, KPI updates, period results, and streak hits.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectHistory history={history} unit={unit} />
        </CardContent>
      </Card>
    </Page>
  );
}
