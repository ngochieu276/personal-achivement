"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { CardListSkeleton } from "@/components/layout/CardListSkeleton";
import { DeleteButton } from "@/components/shared/DeleteButton";
import { DetailHeaderSkeleton } from "@/components/layout/DetailHeaderSkeleton";
import { FormDialog } from "@/components/shared/FormDialog";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectRecordsCard } from "@/components/projects/ProjectRecordsCard";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { ProjectDocumentsDialog } from "@/components/projects/ProjectDocumentsDialog";
import { SubjectPeriodGroups } from "@/components/subjects/SubjectPeriodGroups";
import { OrganizeSubjectsSheet } from "@/components/subjects/OrganizeSubjectsSheet";
import { SubjectFormDialog } from "@/components/subjects/SubjectFormDialog";
import { subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { ViewToggle } from "@/components/layout/ViewToggle";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { GroupTree, Project, Subject, SubjectDetail } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function ProjectDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [organizeOpen, setOrganizeOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [projectGroupIds, setProjectGroupIds] = useState<string[]>([]);

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`),
    enabled: Boolean(id),
  });

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects", id],
    queryFn: () => api<{ subjects: Subject[] }>(`/projects/${id}/subjects`),
    enabled: Boolean(id),
  });

  const createSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api(`/projects/${id}/subjects`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
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
      api<SubjectDetail>(`/subjects/${editingSubject?.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      setEditingSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["subjects", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
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
      router.push("/projects");
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const project = projectQuery.data?.project;
  const canDelete = Boolean(project) && !subjectsQuery.isLoading && subjects.length === 0;
  const deleteControl = canDelete ? (
    <DeleteButton
      label={t("projects.delete")}
      pending={deleteProject.isPending}
      onClick={() => deleteProject.mutate()}
    />
  ) : null;

  return (
    <Page>
      <BackLink to="/projects">{t("projects.all")}</BackLink>
      {projectQuery.isLoading ? (
        <DetailHeaderSkeleton eyebrow={t("projects.eyebrow")} />
      ) : (
        <PageHeader
          eyebrow={t("projects.eyebrow")}
          title={project?.name ?? t("breadcrumb.project")}
          icon={project?.icon}
          onEdit={
            project
              ? () => {
                  setProjectName(project.name);
                  setProjectIcon(project.icon ?? "");
                  setProjectGroupIds(project.groupIds ?? []);
                  setEditingProject(true);
                }
              : undefined
          }
          editLabel={t("projects.edit")}
          actions={
            <>
              <ViewToggle />
              {subjects.length > 0 ? (
                <ProjectActionsMenu
                  onDocuments={() => setDocumentsOpen(true)}
                  onOrganize={() => setOrganizeOpen(true)}
                />
              ) : null}
              {deleteControl}
              <SubjectFormDialog
                open={open}
                onOpenChange={setOpen}
                title={t("subjects.new")}
                formKey={String(open)}
                submitLabel={t("subjects.create")}
                pending={createSubject.isPending}
                error={createSubject.error?.message}
                onSubmit={(values) => createSubject.mutate(values)}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" />
                    {t("subjects.new")}
                  </Button>
                }
              />
            </>
          }
        />
      )}

      <ProjectDocumentsDialog
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        subjects={subjects}
      />
      <OrganizeSubjectsSheet
        open={organizeOpen}
        onOpenChange={setOrganizeOpen}
        projectId={id}
        subjects={subjects}
      />

      <FormDialog open={editingProject} onOpenChange={setEditingProject} title={t("projects.edit")}>
        <ProjectForm
          name={projectName}
          icon={projectIcon}
          onNameChange={setProjectName}
          onIconChange={setProjectIcon}
          groupIds={projectGroupIds}
          onGroupIdsChange={setProjectGroupIds}
          groups={navQuery.data?.groups ?? []}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel={t("common.save")}
        />
      </FormDialog>

      <SubjectFormDialog
        open={Boolean(editingSubject)}
        onOpenChange={(next) => {
          if (!next) setEditingSubject(null);
        }}
        title={t("subjects.edit")}
        formKey={editingSubject?.id}
        initial={editingSubject ? subjectToFormValues(editingSubject) : undefined}
        submitLabel={t("subjects.save")}
        pending={updateSubject.isPending}
        error={updateSubject.error?.message}
        onSubmit={(values) => updateSubject.mutate(values)}
      />

      {subjectsQuery.isLoading ? (
        <PageLoading label={t("subjects.loadingList")}>
          <CardListSkeleton kind="subjects" />
        </PageLoading>
      ) : subjects.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title={t("subjects.emptyTitle")}
          description={t("subjects.emptyDesc")}
          action={deleteControl}
        />
      ) : (
        <>
          <SubjectPeriodGroups
            subjects={subjects}
            variant={mode}
            onEdit={setEditingSubject}
          />
          <ProjectRecordsCard subjects={subjects} />
        </>
      )}
    </Page>
  );
}
