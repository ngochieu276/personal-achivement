import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { unitLabel } from "@/lib/format";
import type { KpiType, SubjectDetail } from "@/lib/types";

export function AddProgressForm({
  subjectId,
  projectId,
  kpiType,
  compact = false,
}: {
  subjectId: string;
  projectId: string;
  kpiType: KpiType;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [add, setAdd] = useState("1");

  const mutation = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ add: Number(add) }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      setAdd("1");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    mutation.mutate();
  }

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <form className={compact ? "relative z-10 flex items-center gap-1" : "flex items-end gap-3"} onSubmit={onSubmit} onClick={stop}>
      <Input
        type="number"
        min="0.1"
        step="0.1"
        value={add}
        aria-label={`Add ${unitLabel(kpiType)}`}
        className={compact ? "h-8 w-20" : undefined}
        onChange={(event) => setAdd(event.target.value)}
      />
      <Button type="submit" size={compact ? "sm" : "default"} disabled={mutation.isPending}>
        <Plus className="h-4 w-4" />
        {compact ? "Add" : `Add ${unitLabel(kpiType)}`}
      </Button>
      {mutation.error && !compact ? (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      ) : null}
    </form>
  );
}
