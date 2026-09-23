import type { FormEvent } from "react";
import { IconPicker } from "@/components/shared/IconPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GroupForm({
  id,
  name,
  icon,
  onIdChange,
  onNameChange,
  onIconChange,
  onSubmit,
  pending,
  error,
  submitLabel,
  idLocked = false,
}: {
  id: string;
  name: string;
  icon: string;
  onIdChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  submitLabel: string;
  idLocked?: boolean;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="group-id">ID</Label>
        <Input
          id="group-id"
          value={id}
          onChange={(event) => onIdChange(event.target.value)}
          placeholder="badminton"
          required
          disabled={idLocked}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-name">Name</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
      </div>
      <IconPicker value={icon} onChange={onIconChange} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
