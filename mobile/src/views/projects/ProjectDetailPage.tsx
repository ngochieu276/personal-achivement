import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { BackLink, EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { OrganizeSubjects } from "@/components/subjects/OrganizeSubjects";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { SubjectForm, subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { SubjectStatusDialog } from "@/components/subjects/SubjectStatus";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog, AppModal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { groupSubjectsByPeriod } from "@/lib/subjects";
import { periodGroupLabel } from "@/lib/subjects";
import type { GroupTree, Project, Subject, SubjectDetail, SubjectStatus } from "@/lib/types";

export function ProjectDetailPage() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [statusSubject, setStatusSubject] = useState<Subject | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [organizeOpen, setOrganizeOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [projectGroupIds, setProjectGroupIds] = useState<string[]>([]);

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`),
    enabled: Boolean(id),
  });
  const navQuery = useQuery({ queryKey: ["nav"], queryFn: () => api<GroupTree>("/groups") });
  const subjectsQuery = useQuery({
    queryKey: ["subjects", id],
    queryFn: () => api<{ subjects: Subject[] }>(`/projects/${id}/subjects`),
    enabled: Boolean(id),
  });

  const createSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api(`/projects/${id}/subjects`, { method: "POST", body: JSON.stringify(values) }),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["subjects", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${editingSubject?.id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: async () => {
      setEditingSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["subjects", id] });
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ status, statusComment }: { status: SubjectStatus; statusComment: string | null }) =>
      api(`/subjects/${statusSubject?.id}`, { method: "PATCH", body: JSON.stringify({ status, statusComment }) }),
    onSuccess: async () => {
      setStatusSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["subjects", id] });
    },
  });
  const updateProject = useMutation({
    mutationFn: () =>
      api(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: projectName, icon: projectIcon, groupIds: projectGroupIds }),
      }),
    onSuccess: async () => {
      setEditingProject(false);
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });
  const deleteProject = useMutation({
    mutationFn: () => api(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      router.replace("/projects");
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const project = projectQuery.data?.project;
  const groups = navQuery.data?.groups ?? [];
  const documents = subjects.flatMap((subject) => subject.documents ?? []);
  const records = subjects.flatMap((subject) => (subject.records ?? []).map((record) => ({ ...record, subject })));

  return (
    <Screen>
      <BackLink href="/projects" label={t("projects.all")} />
      <PageHeader
        eyebrow={t("projects.eyebrow")}
        title={project?.name ?? t("breadcrumb.project")}
        icon={project?.icon}
        actions={
          <>
            <Button size="sm" onPress={() => setOpen(true)}>
              {t("subjects.new")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                if (!project) return;
                setProjectName(project.name);
                setProjectIcon(project.icon ?? "");
                setProjectGroupIds(project.groupIds ?? []);
                setEditingProject(true);
              }}
            >
              {t("projects.edit")}
            </Button>
          </>
        }
      />
      <View className="flex-row flex-wrap gap-2">
        {subjects.length > 0 ? (
          <Button variant="outline" size="sm" onPress={() => setOrganizeOpen(true)}>
            {t("subjects.organize")}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onPress={() => setDocumentsOpen(true)}>
          {t("projects.documents")}
        </Button>
        {subjects.length === 0 ? (
          <Button variant="destructive" size="sm" onPress={() => setConfirmDelete(true)}>
            {t("projects.delete")}
          </Button>
        ) : null}
      </View>

      {subjectsQuery.isLoading ? <Text className="text-muted-foreground">{t("subjects.loadingList")}</Text> : null}
      {subjects.length === 0 && !subjectsQuery.isLoading ? (
        <EmptyState title={t("subjects.emptyTitle")} description={t("subjects.emptyDesc")} />
      ) : (
        groupSubjectsByPeriod(subjects).map((group) => (
          <View key={group.period} className="gap-2">
            <Text className="text-sm font-medium uppercase text-muted-foreground">{periodGroupLabel(group.period)}</Text>
            {group.subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={(next) => {
                  setEditingSubject(next);
                }}
              />
            ))}
          </View>
        ))
      )}

      {records.length > 0 ? (
        <Card>
          <CardTitle>{t("subjects.records")}</CardTitle>
          {records.slice(0, 8).map((record) => (
            <Text key={record.id} className="mt-1 text-sm text-foreground">
              {record.subject.name} · {record.recordNumber}
            </Text>
          ))}
        </Card>
      ) : null}

      <AppModal open={open} onClose={() => setOpen(false)} title={t("subjects.create")}>
        <SubjectForm
          submitLabel={t("common.create")}
          pending={createSubject.isPending}
          error={createSubject.error?.message}
          onSubmit={(values) => createSubject.mutate(values)}
        />
      </AppModal>
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
      <AppModal open={editingProject} onClose={() => setEditingProject(false)} title={t("projects.edit")}>
        <ProjectForm
          name={projectName}
          icon={projectIcon}
          onNameChange={setProjectName}
          onIconChange={setProjectIcon}
          groupIds={projectGroupIds}
          onGroupIdsChange={setProjectGroupIds}
          groups={groups}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel={t("common.save")}
        />
      </AppModal>
      <AppModal open={documentsOpen} onClose={() => setDocumentsOpen(false)} title={t("projects.documentsTitle")}>
        {documents.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t("projects.documentsEmpty")}</Text>
        ) : (
          documents.map((url) => (
            <Text key={url} className="mb-2 text-sm text-secondary" onPress={() => Linking.openURL(url)}>
              {url}
            </Text>
          ))
        )}
      </AppModal>
      <OrganizeSubjects open={organizeOpen} onClose={() => setOrganizeOpen(false)} projectId={id} subjects={subjects} />
      <SubjectStatusDialog
        open={Boolean(statusSubject)}
        onClose={() => setStatusSubject(null)}
        status={statusSubject?.status}
        statusComment={statusSubject?.statusComment}
        pending={updateStatus.isPending}
        error={updateStatus.error?.message}
        onSave={(status, statusComment) => updateStatus.mutate({ status, statusComment })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("projects.delete")}
        description={project?.name ?? ""}
        confirmLabel={deleteProject.isPending ? t("common.deleting") : t("projects.delete")}
        pending={deleteProject.isPending}
        onConfirm={() => deleteProject.mutate()}
      />
    </Screen>
  );
}
