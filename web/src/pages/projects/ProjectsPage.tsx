import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { CardListSkeleton } from "@/components/CardListSkeleton";
import { ListPlaceholder } from "@/components/ListPlaceholder";
import { Page, PageHeader } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectForm } from "@/components/ProjectForm";
import { ViewToggle, viewClass } from "@/components/ViewToggle";
import { api } from "@/lib/api";
import type { GroupTree, Project } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
  });

  const updateProject = useMutation({
    mutationFn: () =>
      api(`/projects/${editing?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName, icon: editIcon, groupIds: editGroupIds }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });

  const projects = projectsQuery.data?.projects ?? [];
  const groups = navQuery.data?.groups ?? [];

  return (
    <Page>
      <PageHeader eyebrow="Collections" title="Projects" actions={<ViewToggle />} />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        title="Edit project"
      >
        <ProjectForm
          name={editName}
          icon={editIcon}
          onNameChange={setEditName}
          onIconChange={setEditIcon}
          groupIds={editGroupIds}
          onGroupIdsChange={setEditGroupIds}
          groups={groups}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel="Save"
        />
      </FormDialog>

      {projectsQuery.isLoading ? (
        <PageLoading label="Loading projects...">
          <CardListSkeleton kind="projects" />
        </PageLoading>
      ) : projects.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title="No projects yet"
          description="Use Create project in the sidebar, then add subjects like running, writing, or practice reps."
        />
      ) : (
        <div className={viewClass(mode, "projects")}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={mode}
              onEdit={(next) => {
                setEditing(next);
                setEditName(next.name);
                setEditIcon(next.icon ?? "");
                setEditGroupIds(next.groupIds ?? []);
              }}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
