import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { SubjectForm, subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { SubjectStatusDialog } from "@/components/subjects/SubjectStatus";
import { Button } from "@/components/ui/Button";
import { AppModal } from "@/components/ui/Modal";
import { EntityIcon } from "@/lib/icons";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { groupArchivedByProject, groupSubjectsByPeriod, periodGroupLabel } from "@/lib/subjects";
import type { Subject, SubjectDetail, SubjectStatus } from "@/lib/types";

export function ArchivedPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [statusSubject, setStatusSubject] = useState<Subject | null>(null);

  const archivedQuery = useQuery({
    queryKey: ["archived-subjects"],
    queryFn: () => api<{ subjects: Subject[] }>("/subjects?status=pending"),
  });

  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${editingSubject?.id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: async (data) => {
      setEditingSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, statusComment }: { status: SubjectStatus; statusComment: string | null }) =>
      api(`/subjects/${statusSubject?.id}`, { method: "PATCH", body: JSON.stringify({ status, statusComment }) }),
    onSuccess: async () => {
      const projectId = statusSubject?.projectId;
      setStatusSubject(null);
      setEditingSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const subjects = archivedQuery.data?.subjects ?? [];
  const groups = groupArchivedByProject(subjects);

  return (
    <Screen>
      <PageHeader
        eyebrow={t("archived.eyebrow")}
        title={t("archived.title")}
        actions={
          <>
            <Button size="sm" variant="outline" onPress={() => router.replace("/projects")}>
              {t("nav.projects")}
            </Button>
            <AccountMenu />
          </>
        }
      />

      {archivedQuery.isLoading ? <Text className="text-muted-foreground">{t("archived.loading")}</Text> : null}
      {subjects.length === 0 && !archivedQuery.isLoading ? (
        <EmptyState title={t("archived.emptyTitle")} description={t("archived.emptyDesc")} />
      ) : (
        groups.map((group) => (
          <View key={group.projectId} className="gap-2">
            <Link href={`/projects/${group.projectId}`} asChild>
              <Pressable className="flex-row items-center gap-2">
                <EntityIcon name={group.icon} />
                <Text className="font-serif text-lg text-foreground">{group.name || t("breadcrumb.project")}</Text>
              </Pressable>
            </Link>
            {groupSubjectsByPeriod(group.subjects).map((periodGroup) => (
              <View key={periodGroup.period} className="gap-2">
                <Text className="text-sm font-medium uppercase text-muted-foreground">
                  {periodGroupLabel(periodGroup.period)}
                </Text>
                {periodGroup.subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onEdit={(next) => {
                      setEditingSubject(next);
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        ))
      )}

      <AppModal open={Boolean(editingSubject)} onClose={() => setEditingSubject(null)} title={t("subjects.edit")}>
        {editingSubject ? (
          <View className="gap-3">
            <Button variant="outline" onPress={() => setStatusSubject(editingSubject)}>
              {t("subjects.updateStatus")}
            </Button>
            <SubjectForm
              key={editingSubject.id}
              initial={subjectToFormValues(editingSubject)}
              submitLabel={t("subjects.save")}
              pending={updateSubject.isPending}
              error={updateSubject.error?.message}
              onSubmit={(values) => updateSubject.mutate(values)}
            />
          </View>
        ) : null}
      </AppModal>
      <SubjectStatusDialog
        open={Boolean(statusSubject)}
        onClose={() => setStatusSubject(null)}
        status={statusSubject?.status}
        statusComment={statusSubject?.statusComment}
        pending={updateStatus.isPending}
        error={updateStatus.error?.message}
        onSave={(status, statusComment) => updateStatus.mutate({ status, statusComment })}
      />
    </Screen>
  );
}
