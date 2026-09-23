import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export function AddProjectsToGroup({
  groupId,
  assignedIds,
}: {
  groupId: string;
  assignedIds: string[];
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });

  const addProjects = useMutation({
    mutationFn: () =>
      api(`/groups/${groupId}/projects`, {
        method: "POST",
        body: JSON.stringify({ projectIds: selected }),
      }),
    onSuccess: async () => {
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const available = (projectsQuery.data?.projects ?? []).filter(
    (project) => !assignedIds.includes(project.id),
  );

  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <Label>Add projects</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <MultiSelect
            options={available.map((project) => ({ value: project.id, label: project.name }))}
            value={selected}
            onChange={setSelected}
            placeholder="Select projects"
            emptyLabel="All projects are already in this group"
          />
        </div>
        <Button
          type="button"
          disabled={selected.length === 0 || addProjects.isPending}
          onClick={() => addProjects.mutate()}
        >
          Add
        </Button>
      </div>
      {addProjects.error ? (
        <p className="text-sm text-destructive">{addProjects.error.message}</p>
      ) : null}
    </div>
  );
}
