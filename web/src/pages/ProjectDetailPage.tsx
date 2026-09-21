import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Flame, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AddProgressForm } from "@/components/AddProgressForm";
import { SubjectForm, type SubjectFormValues } from "@/components/SubjectForm";
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
import { toDateInput } from "@/lib/cycle";
import { periodLabels, remainingLabel, unitLabel } from "@/lib/format";
import type { Project, Subject, SubjectDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useViewStore } from "@/stores/view";

export function ProjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState("");

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`),
    enabled: Boolean(id),
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
    },
  });

  const updateProject = useMutation({
    mutationFn: () =>
      api(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: projectName }),
      }),
    onSuccess: async () => {
      setEditingProject(false);
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-4xl">{projectQuery.data?.project.name ?? "Loading"}</h1>
            {projectQuery.data ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Edit project"
                onClick={() => {
                  setProjectName(projectQuery.data.project.name);
                  setEditingProject(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                New subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New subject</DialogTitle>
              </DialogHeader>
              <SubjectForm
                key={String(open)}
                submitLabel="Create subject"
                pending={createSubject.isPending}
                error={createSubject.error?.message}
                onSubmit={(values) => createSubject.mutate(values)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={editingProject} onOpenChange={setEditingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateProject.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Name</Label>
              <Input
                id="edit-project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
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

      <Dialog open={Boolean(editingSubject)} onOpenChange={(next) => !next && setEditingSubject(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit subject</DialogTitle>
          </DialogHeader>
          {editingSubject ? (
            <SubjectForm
              key={editingSubject.id}
              initial={{
                name: editingSubject.name,
                kpi: editingSubject.kpi,
                kpiTypePeriod: editingSubject.kpiTypePeriod,
                kpiType: editingSubject.kpiType,
                startDate: toDateInput(new Date(editingSubject.startDate)),
                link: editingSubject.link ?? "",
              }}
              submitLabel="Save subject"
              pending={updateSubject.isPending}
              error={updateSubject.error?.message}
              onSubmit={(values) => updateSubject.mutate(values)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {subjectsQuery.isLoading ? (
        <p className="text-muted-foreground">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No subjects yet</CardTitle>
            <CardDescription>
              Add a subject with a KPI. Track the current period, then the API records finish or miss when it ends.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className={viewClass(mode, "subjects")}>
          {subjects.map((subject) => {
            const ratio = Math.min(1, subject.currentProgress / subject.kpi);
            return (
              <Card
                key={subject.id}
                className={cn(mode === "cards" && "transition-transform hover:-translate-y-0.5")}
              >
                {mode === "list" ? (
                  <CardHeader className="flex-row items-center gap-4 p-4">
                    <Link to={`/subjects/${subject.id}`} className="min-w-0 flex-1">
                      <CardTitle className="hover:underline">{subject.name}</CardTitle>
                      <CardDescription>
                        {periodLabels[subject.kpiTypePeriod]} · {subject.currentProgress} / {subject.kpi}{" "}
                        {unitLabel(subject.kpiType)}
                      </CardDescription>
                    </Link>
                    <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                      <div
                        className={cn("h-full rounded-full", ratio >= 1 ? "bg-hit" : "bg-primary")}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Flame className="h-3 w-3" />
                      {subject.currentStreak}
                    </Badge>
                    <AddProgressForm
                      compact
                      subjectId={subject.id}
                      projectId={subject.projectId}
                      kpiType={subject.kpiType}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Edit ${subject.name}`}
                      onClick={() => setEditingSubject(subject)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                ) : (
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/subjects/${subject.id}`} className="min-w-0">
                          <CardTitle className="hover:underline">{subject.name}</CardTitle>
                          <CardDescription>
                            {periodLabels[subject.kpiTypePeriod]} · {subject.kpi} {unitLabel(subject.kpiType)}
                          </CardDescription>
                        </Link>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="gap-1">
                            <Flame className="h-3 w-3" />
                            {subject.currentStreak}
                          </Badge>
                          {subject.activeWindow ? (
                            <Badge variant="secondary">{remainingLabel(subject.activeWindow.end)}</Badge>
                          ) : null}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Edit ${subject.name}`}
                            onClick={() => setEditingSubject(subject)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", ratio >= 1 ? "bg-hit" : "bg-primary")}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>
                          {subject.currentProgress} / {subject.kpi} {unitLabel(subject.kpiType)}
                        </span>
                        {subject.link ? (
                          <a
                            href={subject.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Link
                          </a>
                        ) : null}
                      </div>
                      <AddProgressForm
                        compact
                        subjectId={subject.id}
                        projectId={subject.projectId}
                        kpiType={subject.kpiType}
                      />
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
