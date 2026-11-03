"use client";

import type { ReactNode } from "react";
import { EditButton } from "@/components/shared/EditButton";
import { useI18n } from "@/i18n";
import { EntityIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Page({ children }: { children: ReactNode }) {
  return <div className="min-w-0 space-y-6">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onEdit,
  editLabel,
  actions,
  align = "end",
  icon,
  titleExtra,
}: {
  eyebrow: string;
  title: string;
  titleExtra?: ReactNode;
  subtitle?: ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  actions?: ReactNode;
  align?: "start" | "end";
  icon?: string | null;
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-between",
        align === "start" ? "sm:items-start" : "sm:items-end",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <div className="flex items-center gap-2">
          {icon ? <EntityIcon name={icon} className="h-7 w-7 shrink-0 text-secondary sm:h-8 sm:w-8" /> : null}
          <h1 className="min-w-0 break-words font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
          {titleExtra}
          {onEdit ? <EditButton label={editLabel ?? t("common.editNamed", { name: title })} onClick={onEdit} /> : null}
        </div>
        {subtitle}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}
