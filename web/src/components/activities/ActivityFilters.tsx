"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import type { ActivityRange } from "@/lib/types";

export function ActivityFilters({
  value,
  onChange,
}: {
  value: ActivityRange;
  onChange: (value: ActivityRange) => void;
}) {
  const { t } = useI18n();
  const options: { id: ActivityRange; label: string }[] = [
    { id: "week", label: t("activities.thisWeek") },
    { id: "month", label: t("activities.pastMonth") },
  ];

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={value === option.id}
          className={cn("h-8 px-3", value === option.id && "bg-muted")}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
