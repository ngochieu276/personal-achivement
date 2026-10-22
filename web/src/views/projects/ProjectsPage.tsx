"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { CardListSkeleton } from "@/components/layout/CardListSkeleton";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ViewToggle, viewClass } from "@/components/layout/ViewToggle";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { EntityIcon } from "@/lib/icons";
import type { Group, GroupTree, Project } from "@/lib/types";
import { useViewStore, type ViewMode } from "@/stores/view";

export function ProjectsPage() {
  const { t } = useI18n();
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
  const grouped = groups
    .map((group) => ({
      group,
      projects: projects.filter((project) => project.groupIds?.includes(group.id)),
    }))
    .filter((item) => item.projects.length > 0);
  const ungrouped = projects.filter((project) => !project.groupIds?.length);

  function startEdit(next: Project) {
    setEditing(next);
    setEditName(next.name);
    setEditIcon(next.icon ?? "");
    setEditGroupIds(next.groupIds ?? []);
  }

  return (
    <Page>
      <PageHeader eyebrow={t("projects.collections")} title={t("projects.title")} actions={<ViewToggle />} />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        title={t("projects.edit")}
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
          submitLabel={t("common.save")}
        />
      </FormDialog>

      {projectsQuery.isLoading ? (
        <PageLoading label={t("projects.loading")}>
          <CardListSkeleton kind="projects" />
        </PageLoading>
      ) : projects.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title={t("projects.emptyTitle")}
          description={t("projects.emptyDesc")}
        />
      ) : grouped.length === 0 ? (
        <ProjectGrid projects={projects} mode={mode} onEdit={startEdit} />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ group, projects: groupProjects }) => (
            <ProjectSection
              key={group.id}
              group={group}
              projects={groupProjects}
              mode={mode}
              onEdit={startEdit}
            />
          ))}
          {ungrouped.length > 0 ? (
            <ProjectSection
              title={t("projects.ungrouped")}
              projects={ungrouped}
              mode={mode}
              onEdit={startEdit}
            />
          ) : null}
        </div>
      )}
    </Page>
  );
}

function ProjectSection({
  group,
  title,
  projects,
  mode,
  onEdit,
}: {
  group?: Group;
  title?: string;
  projects: Project[];
  mode: ViewMode;
  onEdit: (project: Project) => void;
}) {
  const heading = group?.name ?? title ?? "";
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {group ? <EntityIcon name={group.icon} className="h-5 w-5 text-secondary" /> : null}
        {group ? (
          <Link href={`/groups/${group.id}`} className="font-serif text-xl hover:underline">
            {heading}
          </Link>
        ) : (
          <h2 className="font-serif text-xl">{heading}</h2>
        )}
        <Badge variant="outline">{projects.length}</Badge>
      </div>
      <ProjectGrid projects={projects} mode={mode} onEdit={onEdit} />
    </section>
  );
}

function ProjectGrid({
  projects,
  mode,
  onEdit,
}: {
  projects: Project[];
  mode: ViewMode;
  onEdit: (project: Project) => void;
}) {
  return (
    <div className={viewClass(mode, "projects")}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} variant={mode} onEdit={onEdit} />
      ))}
    </div>
  );
}
