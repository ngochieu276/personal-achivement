"use client";

import type { FormEvent } from "react";
import { IconPicker } from "@/components/shared/IconPicker";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
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
  const { t } = useI18n();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="project-form-name">{t("common.name")}</Label>
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
          <Label>{t("projects.groupsOptional")}</Label>
          <MultiSelect
            options={groups.map((group) => ({ value: group.id, label: `${group.name} (${group.id})` }))}
            value={groupIds}
            onChange={onGroupIdsChange}
            placeholder={t("projects.selectGroups")}
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
