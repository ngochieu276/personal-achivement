import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { ListPlaceholder } from "@/components/ListPlaceholder";
import { NameForm } from "@/components/NameForm";
import { Page, PageHeader } from "@/components/PageHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { ViewToggle, viewClass } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });

  const createProject = useMutation({
    mutationFn: () =>
      api("/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: async () => {
      setName("");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProject = useMutation({
    mutationFn: () =>
      api(`/projects/${editing?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const projects = projectsQuery.data?.projects ?? [];

  return (
    <Page>
      <PageHeader
        eyebrow="Collections"
        title="Projects"
        actions={
          <>
            <ViewToggle />
            <FormDialog
              open={open}
              onOpenChange={setOpen}
              title="New project"
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  New project
                </Button>
              }
            >
              <NameForm
                id="project-name"
                value={name}
                onChange={setName}
                onSubmit={() => createProject.mutate()}
                pending={createProject.isPending}
                error={createProject.error?.message}
                submitLabel="Create"
              />
            </FormDialog>
          </>
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        title="Edit project"
      >
        <NameForm
          id="edit-project-name"
          value={editName}
          onChange={setEditName}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel="Save"
        />
      </FormDialog>

      {projectsQuery.isLoading ? (
        <ListPlaceholder variant="loading" label="Loading projects..." />
      ) : projects.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title="No projects yet"
          description="Create a project, then add subjects like running, writing, or practice reps."
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
              }}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
