import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ViewToggle, viewClass } from "@/components/ViewToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createProject.mutate();
  }

  function onEdit(event: FormEvent) {
    event.preventDefault();
    updateProject.mutate();
  }

  const projects = projectsQuery.data?.projects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Collections</p>
          <h1 className="font-serif text-4xl">Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                {createProject.error ? (
                  <p className="text-sm text-destructive">{createProject.error.message}</p>
                ) : null}
                <Button type="submit" disabled={createProject.isPending}>
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onEdit}>
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Name</Label>
              <Input
                id="edit-project-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>
            {updateProject.error ? (
              <p className="text-sm text-destructive">{updateProject.error.message}</p>
            ) : null}
            <Button type="submit" disabled={updateProject.isPending}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {projectsQuery.isLoading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create a project, then add subjects like running, writing, or practice reps.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className={viewClass(mode, "projects")}>
          {projects.map((project) => (
            <Card
              key={project.id}
              className={cn(
                "transition-transform hover:-translate-y-0.5",
                mode === "list" && "hover:translate-y-0",
              )}
            >
              <CardHeader className={mode === "list" ? "flex-row items-center gap-4 p-4" : undefined}>
                <div className={cn("flex items-center justify-between", mode === "list" && "w-full")}>
                  <FolderKanban className="h-5 w-5 shrink-0 text-secondary" />
                  {mode === "cards" ? (
                    <Badge variant="outline">{project.subjectCount ?? 0} subjects</Badge>
                  ) : null}
                </div>
                <div className={cn(mode === "list" && "min-w-0 flex-1")}>
                  <Link to={`/projects/${project.id}`}>
                    <CardTitle className="hover:underline">{project.name}</CardTitle>
                  </Link>
                  <CardDescription>
                    Started {formatDate(project.createdAt)}
                    {mode === "list" ? ` · ${project.subjectCount ?? 0} subjects` : ""}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  aria-label={`Edit ${project.name}`}
                  onClick={() => {
                    setEditing(project);
                    setEditName(project.name);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              {mode === "cards" ? <CardContent /> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
