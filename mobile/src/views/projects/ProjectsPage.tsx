import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { GroupForm } from "@/components/projects/GroupForm";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/Button";
import { AppModal } from "@/components/ui/Modal";
import { EntityIcon } from "@/lib/icons";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { GroupTree, Project } from "@/lib/types";

export function ProjectsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [groupId, setGroupId] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });
  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
  });

  const create = useMutation({
    mutationFn: () => api("/projects", { method: "POST", body: JSON.stringify({ name, icon, groupIds }) }),
    onSuccess: async () => {
      setCreateOpen(false);
      setName("");
      setIcon("");
      setGroupIds([]);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });
  const update = useMutation({
    mutationFn: () =>
      api(`/projects/${editing?.id}`, { method: "PATCH", body: JSON.stringify({ name, icon, groupIds }) }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });
  const createGroup = useMutation({
    mutationFn: () =>
      api("/groups", { method: "POST", body: JSON.stringify({ id: groupId, name: groupName, icon: groupIcon }) }),
    onSuccess: async () => {
      setGroupOpen(false);
      setGroupId("");
      setGroupName("");
      setGroupIcon("");
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });

  const projects = projectsQuery.data?.projects ?? [];
  const groups = navQuery.data?.groups ?? [];
  const ungrouped = navQuery.data?.ungrouped ?? [];

  return (
    <Screen>
      <PageHeader
        eyebrow={t("projects.collections")}
        title={t("projects.title")}
        actions={
          <>
            <Button size="sm" onPress={() => setCreateOpen(true)}>
              {t("projects.create")}
            </Button>
            <AccountMenu />
          </>
        }
      />
      <Button variant="outline" onPress={() => setGroupOpen(true)}>
        {t("nav.createGroup")}
      </Button>

      {groups.map((group) => (
        <View key={group.id} className="gap-2">
          <Link href={`/groups/${group.id}`} asChild>
            <Pressable className="flex-row items-center gap-2">
              <EntityIcon name={group.icon} />
              <Text className="font-serif text-lg text-foreground">{group.name}</Text>
            </Pressable>
          </Link>
          {group.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(next) => {
                setEditing(next);
                setName(next.name);
                setIcon(next.icon ?? "");
                setGroupIds(next.groupIds ?? []);
              }}
            />
          ))}
        </View>
      ))}

      {ungrouped.length > 0 ? (
        <Text className="font-serif text-lg text-foreground">{t("projects.all")}</Text>
      ) : null}
      {projectsQuery.isLoading ? <Text className="text-muted-foreground">{t("projects.loading")}</Text> : null}
      {projects.length === 0 && !projectsQuery.isLoading ? (
        <EmptyState title={t("projects.emptyTitle")} description={t("projects.emptyDesc")} />
      ) : (
        (ungrouped.length ? ungrouped : projects).map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={(next) => {
              setEditing(next);
              setName(next.name);
              setIcon(next.icon ?? "");
              setGroupIds(next.groupIds ?? []);
            }}
          />
        ))
      )}

      <AppModal open={createOpen} onClose={() => setCreateOpen(false)} title={t("projects.create")}>
        <ProjectForm
          name={name}
          icon={icon}
          onNameChange={setName}
          onIconChange={setIcon}
          groupIds={groupIds}
          onGroupIdsChange={setGroupIds}
          groups={groups}
          onSubmit={() => create.mutate()}
          pending={create.isPending}
          error={create.error?.message}
          submitLabel={t("common.create")}
        />
      </AppModal>
      <AppModal open={Boolean(editing)} onClose={() => setEditing(null)} title={t("projects.edit")}>
        <ProjectForm
          name={name}
          icon={icon}
          onNameChange={setName}
          onIconChange={setIcon}
          groupIds={groupIds}
          onGroupIdsChange={setGroupIds}
          groups={groups}
          onSubmit={() => update.mutate()}
          pending={update.isPending}
          error={update.error?.message}
          submitLabel={t("common.save")}
        />
      </AppModal>
      <AppModal open={groupOpen} onClose={() => setGroupOpen(false)} title={t("groups.new")}>
        <GroupForm
          showId
          id={groupId}
          name={groupName}
          icon={groupIcon}
          onIdChange={setGroupId}
          onNameChange={setGroupName}
          onIconChange={setGroupIcon}
          onSubmit={() => createGroup.mutate()}
          pending={createGroup.isPending}
          error={createGroup.error?.message}
          submitLabel={t("common.create")}
        />
      </AppModal>
    </Screen>
  );
}
