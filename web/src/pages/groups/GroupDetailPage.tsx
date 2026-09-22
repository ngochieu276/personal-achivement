import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddProjectsToGroup } from "@/components/AddProjectsToGroup";
import { BackLink } from "@/components/BackLink";
import { CardListSkeleton } from "@/components/CardListSkeleton";
import { DeleteButton } from "@/components/DeleteButton";
import { DetailHeaderSkeleton } from "@/components/DetailHeaderSkeleton";
import { FormDialog } from "@/components/FormDialog";
import { GroupForm } from "@/components/GroupForm";
import { ListPlaceholder } from "@/components/ListPlaceholder";
import { Page, PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectForm } from "@/components/ProjectForm";
import { ViewToggle, viewClass } from "@/components/ViewToggle";
import { api } from "@/lib/api";
import type { Group, GroupTree, Project } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      navigate("/");
    },
  });

  const group = groupQuery.data?.group;
  const projects = group?.projects ?? [];
  const allGroups = navQuery.data?.groups ?? [];
  const canDelete = Boolean(group) && projects.length === 0;
  const deleteControl = canDelete ? (
    <DeleteButton
      label="Delete group"
      pending={deleteGroup.isPending}
      onClick={() => deleteGroup.mutate()}
    />
  ) : null;

  return (
    <Page>
      <BackLink to="/">All projects</BackLink>
      {groupQuery.isLoading ? (
        <DetailHeaderSkeleton eyebrow="Group" />
      ) : (
        <PageHeader
          eyebrow="Group"
          title={group ? `${group.name}` : "Group"}
          icon={group?.icon}
          subtitle={group ? <p className="mt-1 text-sm text-muted-foreground">ID {group.id}</p> : null}
          onEdit={
            group
              ? () => {
                  setGroupName(group.name);
                  setGroupIcon(group.icon ?? "");
                  setEditingGroup(true);
                }
              : undefined
          }
          editLabel="Edit group"
          actions={
            <>
              <ViewToggle />
              {deleteControl}
            </>
          }
        />
      )}

      <FormDialog open={editingGroup} onOpenChange={setEditingGroup} title="Edit group">
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
          submitLabel="Save"
          idLocked
        />
      </FormDialog>

      <FormDialog
        open={Boolean(editingProject)}
        onOpenChange={(next) => {
          if (!next) setEditingProject(null);
        }}
        title="Edit project"
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
          submitLabel="Save"
        />
      </FormDialog>

      {groupQuery.isLoading ? (
        <PageLoading label="Loading group...">
          <CardListSkeleton kind="projects" />
        </PageLoading>
      ) : !group ? (
        <ListPlaceholder variant="error" label="Group not found." />
      ) : (
        <>
          <AddProjectsToGroup groupId={group.id} assignedIds={projects.map((project) => project.id)} />
          {projects.length === 0 ? (
            <ListPlaceholder
              variant="empty"
              title="No projects in this group"
              description="Select existing projects above, or delete this group."
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
