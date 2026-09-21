import type { FormEvent } from "react";
import { IconPicker } from "@/components/IconPicker";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Group } from "@/lib/types";

export function ProjectForm({
  name,
  icon,
  onNameChange,
  onIconChange,
  groupIds,
  onGroupIdsChange,
  groups,
  onSubmit,
  pending,
  error,
  submitLabel,
}: {
  name: string;
  icon: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  groupIds: string[];
  onGroupIdsChange: (value: string[]) => void;
  groups: Array<Pick<Group, "id" | "name">>;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  submitLabel: string;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="project-form-name">Name</Label>
        <Input
          id="project-form-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
      </div>
      <IconPicker value={icon} onChange={onIconChange} />
      {groups.length > 0 ? (
        <div className="space-y-2">
          <Label>Groups (optional)</Label>
          <MultiSelect
            options={groups.map((group) => ({ value: group.id, label: `${group.name} (${group.id})` }))}
            value={groupIds}
            onChange={onGroupIdsChange}
            placeholder="Select groups"
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
