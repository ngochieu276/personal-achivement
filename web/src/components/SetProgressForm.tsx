import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetProgressForm({
  unit,
  value,
  onChange,
  onSubmit,
  pending,
  error,
}: {
  unit: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <>
      <form className="flex items-end gap-3" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-2">
          <Label htmlFor="progress">Set current {unit}</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            step="0.1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  );
}
