import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { BackLink, EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { AddProgressForm, SetProgressForm } from "@/components/subjects/ProgressControls";
import {
  SubjectDocuments,
  SubjectFiles,
  SubjectHistoryList,
  SubjectImages,
  SubjectNote,
  SubjectPeriodChart,
  SubjectRecords,
} from "@/components/subjects/SubjectExtras";
import { SubjectForm, subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { SubjectStatusBadge, SubjectStatusDialog } from "@/components/subjects/SubjectStatus";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AppModal, ConfirmDialog } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { formatDate, periodLabel, remainingLabel, unitLabel } from "@/lib/format";
import { betterDirectionLabel, typeOfRecordLabel } from "@/lib/record";
import { exceedAmount, latestRecordNumber } from "@/lib/subjects";
import type { SubjectDetail, SubjectStatus } from "@/lib/types";

export function SubjectDetailPage() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState("");
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["subject", id],
    queryFn: () => api<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (detailQuery.data) setProgress(String(detailQuery.data.subject.currentProgress));
  }, [detailQuery.data]);

  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditing(false);
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ status, statusComment }: { status: SubjectStatus; statusComment: string | null }) =>
      api<SubjectDetail>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify({ status, statusComment }) }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      setStatusOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
    },
  });
  const deleteSubject = useMutation({
    mutationFn: () => api(`/subjects/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      const projectId = detailQuery.data?.subject.projectId;
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
      router.replace(projectId ? `/projects/${projectId}` : "/projects");
    },
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

  const { subject, activeWindow, history, files } = detailQuery.data;
  const unit = unitLabel(subject.kpiType);
  const latest = latestRecordNumber(subject);
  const exceed = exceedAmount(subject.currentProgress, subject.kpi);

  return (
    <Screen>
      <BackLink href={`/projects/${subject.projectId}`} label={t("subjects.backToProject")} />
      <PageHeader
        eyebrow={t("subjects.eyebrow")}
        title={subject.name}
        icon={subject.icon}
        subtitle={
          <View className="mt-2 gap-1">
            <SubjectStatusBadge status={subject.status} comment={subject.statusComment} />
            <Text className="text-sm text-muted-foreground">
              {t("subjects.cycleStarted", { period: periodLabel(subject.kpiTypePeriod), date: formatDate(subject.startDate) })}
            </Text>
            {subject.typeOfRecord ? (
              <Text className="text-sm text-muted-foreground">
                {typeOfRecordLabel(subject.typeOfRecord)}
                {latest != null ? ` ${latest}` : ""}
                {subject.betterDirection ? ` (${betterDirectionLabel(subject.betterDirection)})` : ""}
              </Text>
            ) : null}
            <Text className="text-sm text-muted-foreground">
              {t("time.streak", { count: subject.currentStreak })} ·{" "}
              {t("time.finishedCycles", {
                finished: subject.finishedCycles ?? 0,
                total: subject.totalCycles ?? 0,
              })}{" "}
              · {remainingLabel(activeWindow.end)}
            </Text>
          </View>
        }
        actions={
          <View className="gap-2">
            <Button size="sm" variant="outline" onPress={() => setActivityOpen(true)}>
              {t("subjects.eventsButton")}
            </Button>
            <Button size="sm" variant="outline" onPress={() => router.push(`/subjects/${subject.id}/timeline`)}>
              {t("subjects.timeline")}
            </Button>
            <Button size="sm" variant="outline" onPress={() => setEditing(true)}>
              {t("subjects.edit")}
            </Button>
            <Button size="sm" variant="destructive" onPress={() => setConfirmDelete(true)}>
              {t("subjects.delete")}
            </Button>
          </View>
        }
      />

      <Card>
        <CardTitle>{t("subjects.thisPeriod")}</CardTitle>
        <Text className="mt-2 text-sm text-foreground">
          {subject.currentProgress} / {subject.kpi} {unit}
          {exceed > 0 ? ` · +${exceed}` : ""}
        </Text>
        <View className="mt-2">
          <ProgressBar current={subject.currentProgress} target={subject.kpi} />
        </View>
        {subject.link ? (
          <Text className="mt-2 text-sm text-secondary" onPress={() => Linking.openURL(subject.link!)}>
            {t("common.openResource")}
          </Text>
        ) : null}
        <View className="mt-4 gap-3">
          <SetProgressForm
            subjectId={subject.id}
            projectId={subject.projectId}
            value={progress}
            onChange={setProgress}
            unit={unit}
          />
          <AddProgressForm
            subjectId={subject.id}
            projectId={subject.projectId}
            kpiType={subject.kpiType}
            subjectName={subject.name}
            subjectIcon={subject.icon}
          />
        </View>
      </Card>

      <SubjectPeriodChart subject={subject} activeWindow={activeWindow} unit={unit} />
      <SubjectNote subjectId={subject.id} note={subject.note} />
      <SubjectImages subjectId={subject.id} images={subject.images ?? []} />
      <SubjectFiles subjectId={subject.id} files={files} />
      <SubjectDocuments subjectId={subject.id} documents={subject.documents ?? []} />
      <SubjectRecords
        subjectId={subject.id}
        projectId={subject.projectId}
        records={subject.records}
        enabled={Boolean(subject.typeOfRecord)}
      />

      <AppModal open={editing} onClose={() => setEditing(false)} title={t("subjects.edit")}>
        <View className="gap-3">
          <Button variant="outline" onPress={() => setStatusOpen(true)}>
            {t("subjects.updateStatus")}
          </Button>
          <SubjectForm
            key={subject.id}
            initial={subjectToFormValues(subject)}
            submitLabel={t("subjects.save")}
            pending={updateSubject.isPending}
            error={updateSubject.error?.message}
            onSubmit={(values) => updateSubject.mutate(values)}
          />
        </View>
      </AppModal>
      <SubjectStatusDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        status={subject.status}
        statusComment={subject.statusComment}
        pending={updateStatus.isPending}
        error={updateStatus.error?.message}
        onSave={(status, statusComment) => updateStatus.mutate({ status, statusComment })}
      />
      <AppModal open={activityOpen} onClose={() => setActivityOpen(false)} title={t("subjects.eventsHistory")}>
        <CardDescription>{t("subjects.historyHint")}</CardDescription>
        <View className="mt-3">
          <SubjectHistoryList history={history} unit={unit} />
        </View>
      </AppModal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("subjects.deleteConfirm")}
        description={t("subjects.deleteForever", { name: subject.name })}
        confirmLabel={deleteSubject.isPending ? t("subjects.deleting") : t("subjects.delete")}
        pending={deleteSubject.isPending}
        onConfirm={() => deleteSubject.mutate()}
      />
    </Screen>
  );
}
