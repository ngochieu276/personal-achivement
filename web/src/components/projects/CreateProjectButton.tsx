"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { GroupTree } from "@/lib/types";

export function CreateProjectButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
    staleTime: 60_000,
  });

  const createProject = useMutation({
    mutationFn: () =>
      api("/projects", {
        method: "POST",
        body: JSON.stringify({ name, icon, groupIds }),
      }),
    onSuccess: async () => {
      setName("");
      setIcon("");
      setGroupIds([]);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="New project"
      trigger={
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Create project
        </Button>
      }
    >
      <ProjectForm
        name={name}
        icon={icon}
        onNameChange={setName}
        onIconChange={setIcon}
        groupIds={groupIds}
        onGroupIdsChange={setGroupIds}
        groups={navQuery.data?.groups ?? []}
        onSubmit={() => createProject.mutate()}
        pending={createProject.isPending}
        error={createProject.error?.message}
        submitLabel="Create"
      />
    </FormDialog>
  );
}
