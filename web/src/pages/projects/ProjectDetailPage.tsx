import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { FormDialog } from "@/components/FormDialog";
import { ListPlaceholder } from "@/components/ListPlaceholder";
import { NameForm } from "@/components/NameForm";
import { Page, PageHeader } from "@/components/PageHeader";
import { SubjectCard } from "@/components/SubjectCard";
import { SubjectFormDialog } from "@/components/SubjectFormDialog";
import { subjectToFormValues, type SubjectFormValues } from "@/components/SubjectForm";
import { ViewToggle, viewClass } from "@/components/ViewToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Project, Subject, SubjectDetail } from "@/lib/types";
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
  const project = projectQuery.data?.project;

  return (
    <Page>
      <BackLink to="/">All projects</BackLink>
      <PageHeader
        eyebrow="Project"
        title={project?.name ?? "Loading"}
        onEdit={
          project
            ? () => {
                setProjectName(project.name);
                setEditingProject(true);
              }
            : undefined
        }
        editLabel="Edit project"
        actions={
          <>
            <ViewToggle />
            <SubjectFormDialog
              open={open}
              onOpenChange={setOpen}
              title="New subject"
              formKey={String(open)}
              submitLabel="Create subject"
              pending={createSubject.isPending}
              error={createSubject.error?.message}
              onSubmit={(values) => createSubject.mutate(values)}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  New subject
                </Button>
              }
            />
          </>
        }
      />

      <FormDialog open={editingProject} onOpenChange={setEditingProject} title="Edit project">
        <NameForm
          id="edit-project-name"
          value={projectName}
          onChange={setProjectName}
          onSubmit={() => updateProject.mutate()}
          pending={updateProject.isPending}
          error={updateProject.error?.message}
          submitLabel="Save"
        />
      </FormDialog>

      <SubjectFormDialog
        open={Boolean(editingSubject)}
        onOpenChange={(next) => {
          if (!next) setEditingSubject(null);
        }}
        title="Edit subject"
        formKey={editingSubject?.id}
        initial={editingSubject ? subjectToFormValues(editingSubject) : undefined}
        submitLabel="Save subject"
        pending={updateSubject.isPending}
        error={updateSubject.error?.message}
        onSubmit={(values) => updateSubject.mutate(values)}
      />

      {subjectsQuery.isLoading ? (
        <ListPlaceholder variant="loading" label="Loading subjects..." />
      ) : subjects.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title="No subjects yet"
          description="Add a subject with a KPI. Track the current period, then the API records finish or miss when it ends."
        />
      ) : (
        <div className={viewClass(mode, "subjects")}>
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              variant={mode}
              onEdit={setEditingSubject}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
