import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackLink, EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { GroupForm } from "@/components/projects/GroupForm";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/Button";
import { AppModal, ConfirmDialog } from "@/components/ui/Modal";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { Group, GroupTree, Project } from "@/lib/types";

export function GroupDetailPage() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [projectGroupIds, setProjectGroupIds] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const groupQuery = useQuery({
    queryKey: ["group", id],
    queryFn: () => api<{ group: Group }>(`/groups/${id}`),
    enabled: Boolean(id),
  });
  const navQuery = useQuery({ queryKey: ["nav"], queryFn: () => api<GroupTree>("/groups") });
  const group = groupQuery.data?.group;
  const allProjects = [
    ...(navQuery.data?.ungrouped ?? []),
    ...(navQuery.data?.groups ?? []).flatMap((item) => item.projects),
  ];
  const available = allProjects.filter((project) => !group?.projects.some((item) => item.id === project.id));

  const updateGroup = useMutation({
    mutationFn: () => api(`/groups/${id}`, { method: "PATCH", body: JSON.stringify({ name: groupName, icon: groupIcon }) }),
    onSuccess: async () => {
      setEditingGroup(false);
      await queryClient.invalidateQueries({ queryKey: ["group", id] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });
  const addProjects = useMutation({
    mutationFn: () => api(`/groups/${id}/projects`, { method: "POST", body: JSON.stringify({ projectIds: selected }) }),
    onSuccess: async () => {
      setAddOpen(false);
      setSelected([]);
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
      router.replace("/projects");
    },
  });

  return (
    <Screen>
      <BackLink href="/projects" label={t("projects.all")} />
      <PageHeader
        eyebrow={t("groups.eyebrow")}
        title={group?.name ?? t("breadcrumb.group")}
        icon={group?.icon}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                if (!group) return;
                setGroupName(group.name);
                setGroupIcon(group.icon ?? "");
                setEditingGroup(true);
              }}
            >
              {t("groups.edit")}
            </Button>
            {(group?.projects.length ?? 0) === 0 ? (
              <Button size="sm" variant="destructive" onPress={() => setConfirmDelete(true)}>
                {t("groups.delete")}
              </Button>
            ) : null}
          </>
        }
      />
      <Button variant="outline" onPress={() => setAddOpen(true)}>
        {t("groups.addProjects")}
      </Button>
      {groupQuery.isLoading ? <Text className="text-muted-foreground">{t("groups.loading")}</Text> : null}
      {!groupQuery.isLoading && (group?.projects.length ?? 0) === 0 ? (
        <EmptyState title={t("groups.emptyTitle")} description={t("groups.emptyDesc")} />
      ) : (
        group?.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={(next) => {
              setEditingProject(next);
              setProjectName(next.name);
              setProjectIcon(next.icon ?? "");
              setProjectGroupIds(next.groupIds ?? []);
            }}
          />
        ))
      )}
      <AppModal open={editingGroup} onClose={() => setEditingGroup(false)} title={t("groups.edit")}>
        <GroupForm
          name={groupName}
          icon={groupIcon}
          onNameChange={setGroupName}
          onIconChange={setGroupIcon}
          onSubmit={() => updateGroup.mutate()}
          pending={updateGroup.isPending}
          error={updateGroup.error?.message}
          submitLabel={t("common.save")}
        />
      </AppModal>
      <AppModal open={Boolean(editingProject)} onClose={() => setEditingProject(null)} title={t("projects.edit")}>
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
      </AppModal>
      <AppModal open={addOpen} onClose={() => setAddOpen(false)} title={t("groups.addProjects")}>
        {available.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t("groups.allInGroup")}</Text>
        ) : (
          <View className="gap-2">
            {available.map((project) => {
              const on = selected.includes(project.id);
              return (
                <Button
                  key={project.id}
                  variant={on ? "secondary" : "outline"}
                  onPress={() =>
                    setSelected(on ? selected.filter((item) => item !== project.id) : [...selected, project.id])
                  }
                >
                  {project.name}
                </Button>
              );
            })}
            <Button loading={addProjects.isPending} disabled={selected.length === 0} onPress={() => addProjects.mutate()}>
              {t("common.add")}
            </Button>
          </View>
        )}
      </AppModal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("groups.delete")}
        description={group?.name ?? ""}
        confirmLabel={t("groups.delete")}
        pending={deleteGroup.isPending}
        onConfirm={() => deleteGroup.mutate()}
      />
    </Screen>
  );
}
