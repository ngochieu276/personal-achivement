"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AddProjectsToGroup } from "@/components/projects/AddProjectsToGroup";
import { BackLink } from "@/components/layout/BackLink";
import { CardListSkeleton } from "@/components/layout/CardListSkeleton";
import { DeleteButton } from "@/components/shared/DeleteButton";
import { DetailHeaderSkeleton } from "@/components/layout/DetailHeaderSkeleton";
import { FormDialog } from "@/components/shared/FormDialog";
import { GroupForm } from "@/components/projects/GroupForm";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ViewToggle, viewClass } from "@/components/layout/ViewToggle";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { Group, GroupTree, Project } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function GroupDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [projectGroupIds, setProjectGroupIds] = useState<string[]>([]);

  const groupQuery = useQuery({
    queryKey: ["group", id],
    queryFn: () => api<{ group: Group }>(`/groups/${id}`),
    enabled: Boolean(id),
  });

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
  });

  const updateGroup = useMutation({
    mutationFn: () =>
      api(`/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: groupName, icon: groupIcon }),
      }),
    onSuccess: async () => {
      setEditingGroup(false);
      await queryClient.invalidateQueries({ queryKey: ["group", id] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });

  const updateProject = useMutation({
    mutationFn: () =>
      api(`/projects/${editingProject?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: projectName, icon: projectIcon, groupIds: projectGroupIds }),
      }),
    onSuccess: async () => {
      setEditingProject(null);
      await queryClient.invalidateQueries({ queryKey: ["group", id] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: () => api(`/groups/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
  });

  const group = groupQuery.data?.group;
  const projects = group?.projects ?? [];
  const allGroups = navQuery.data?.groups ?? [];
  const canDelete = Boolean(group) && projects.length === 0;
  const deleteControl = canDelete ? (
    <DeleteButton
      label={t("groups.delete")}
      pending={deleteGroup.isPending}
      onClick={() => deleteGroup.mutate()}
    />
  ) : null;

  return (
    <Page>
      <BackLink to="/projects">{t("projects.all")}</BackLink>
      {groupQuery.isLoading ? (
        <DetailHeaderSkeleton eyebrow={t("groups.eyebrow")} />
      ) : (
        <PageHeader
          eyebrow={t("groups.eyebrow")}
          title={group ? `${group.name}` : t("groups.eyebrow")}
          icon={group?.icon}
          subtitle={
            group ? (
              <p className="mt-1 text-sm text-muted-foreground">{t("groups.idValue", { id: group.id })}</p>
            ) : null
          }
          onEdit={
            group
              ? () => {
                  setGroupName(group.name);
                  setGroupIcon(group.icon ?? "");
                  setEditingGroup(true);
                }
              : undefined
          }
          editLabel={t("groups.edit")}
          actions={
            <>
              <ViewToggle />
              {deleteControl}
            </>
          }
        />
      )}

      <FormDialog open={editingGroup} onOpenChange={setEditingGroup} title={t("groups.edit")}>
        <GroupForm
          id={group?.id ?? ""}
          name={groupName}
          icon={groupIcon}
          onIdChange={() => undefined}
          onNameChange={setGroupName}
          onIconChange={setGroupIcon}
          onSubmit={() => updateGroup.mutate()}
          pending={updateGroup.isPending}
          error={updateGroup.error?.message}
          submitLabel={t("common.save")}
          idLocked
        />
      </FormDialog>

      <FormDialog
        open={Boolean(editingProject)}
        onOpenChange={(next) => {
          if (!next) setEditingProject(null);
        }}
        title={t("projects.edit")}
      >
        <ProjectForm
          name={projectName}
          icon={projectIcon}
          onNameChange={setProjectName}
          onIconChange={setProjectIcon}
          groupIds={projectGroupIds}
          onGroupIdsChange={setProjectGroupIds}
          groups={allGroups}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel={t("common.save")}
        />
      </FormDialog>

      {groupQuery.isLoading ? (
        <PageLoading label={t("groups.loading")}>
          <CardListSkeleton kind="projects" />
        </PageLoading>
      ) : !group ? (
        <ListPlaceholder variant="error" label={t("groups.notFound")} />
      ) : (
        <>
          <AddProjectsToGroup groupId={group.id} assignedIds={projects.map((project) => project.id)} />
          {projects.length === 0 ? (
            <ListPlaceholder
              variant="empty"
              title={t("groups.emptyTitle")}
              description={t("groups.emptyDesc")}
              action={deleteControl}
            />
          ) : (
            <div className={viewClass(mode, "projects")}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant={mode}
                  onEdit={(next) => {
                    setEditingProject(next);
                    setProjectName(next.name);
                    setProjectIcon(next.icon ?? "");
                    setProjectGroupIds(next.groupIds ?? []);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
