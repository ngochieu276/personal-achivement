import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AddProgressForm } from "@/components/subjects/AddProgressForm";
import { BackLink } from "@/components/layout/BackLink";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DeleteButton } from "@/components/shared/DeleteButton";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { SubjectPageSkeleton } from "@/components/subjects/SubjectPageSkeleton";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ResourceLink } from "@/components/shared/ResourceLink";
import { SetProgressForm } from "@/components/subjects/SetProgressForm";
import { RemainingBadge, StreakBadge } from "@/components/subjects/StreakBadge";
import { SubjectDocuments } from "@/components/subjects/SubjectDocuments";
import { SubjectFormDialog } from "@/components/subjects/SubjectFormDialog";
import { ExceedFlame } from "@/components/shared/ExceedFlame";
import { SubjectActivityButton, SubjectActivityDialog } from "@/components/subjects/SubjectActivityDialog";
import { SubjectTimelineButton } from "@/components/subjects/PeriodTimeline";
import { SubjectNote } from "@/components/subjects/SubjectNote";
import { SubjectRecordsCard } from "@/components/subjects/SubjectRecordsCard";
import { SubjectFiles } from "@/components/subjects/SubjectFiles";
import { subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDate, periodLabels, unitLabel } from "@/lib/format";
import { betterDirectionLabels, typeOfRecordLabels } from "@/lib/record";
import { exceedAmount, latestRecordNumber } from "@/lib/subjects";
import type { SubjectDetail } from "@/lib/types";

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState("");
  const [editing, setEditing] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
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
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      setEditing(false);
    },
  });

  const deleteSubject = useMutation({
    mutationFn: () => api(`/subjects/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      const projectId = detailQuery.data?.subject.projectId;
      setConfirmDelete(false);
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (projectId) router.push(`/projects/${projectId}`);
      else router.push("/projects");
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

  const { subject, activeWindow, history, files } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);
  const latest = latestRecordNumber(subject);
  const exceed = exceedAmount(subject.currentProgress, subject.kpi);

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
              ? ` · ${typeOfRecordLabels[subject.typeOfRecord]}${latest != null ? ` ${latest}` : ""}${subject.betterDirection ? ` (${betterDirectionLabels[subject.betterDirection]})` : ""}`
              : ""}
          </p>
        }
        actions={
          <>
            <SubjectActivityButton onClick={() => setActivityOpen(true)} />
            <SubjectTimelineButton subjectId={subject.id} />
            <StreakBadge streak={subject.currentStreak} variant="labeled" />
            <RemainingBadge end={activeWindow.end} />
            <DeleteButton
              label="Delete subject"
              pending={deleteSubject.isPending}
              onClick={() => setConfirmDelete(true)}
            />
          </>
        }
      />

      <SubjectActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        history={history}
        periodStart={activeWindow.start}
        unit={unit}
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete subject?"
        description={`This permanently deletes “${subject.name}” and its progress, events, history, and records.`}
        confirmLabel={deleteSubject.isPending ? "Deleting..." : "Delete subject"}
        pending={deleteSubject.isPending}
        error={deleteSubject.error?.message}
        onConfirm={() => deleteSubject.mutate()}
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
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {subject.currentProgress} / {subject.kpi} {unit}
              <ExceedFlame exceed={exceed} />
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
      <div className="grid gap-4 lg:grid-cols-3">
        <SubjectRecordsCard subject={subject} />
        <div className="lg:col-span-2">
          <SubjectFiles subjectId={subject.id} files={files ?? []} />
        </div>
      </div>
      <SubjectDocuments
        documents={subject.documents ?? []}
        pending={updateExtras.isPending}
        error={updateExtras.error?.message}
        onChange={(documents) => updateExtras.mutate({ documents })}
      />
    </Page>
  );
}
