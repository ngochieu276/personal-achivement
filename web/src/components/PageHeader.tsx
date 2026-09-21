import type { ReactNode } from "react";
import { EditButton } from "@/components/EditButton";
import { cn } from "@/lib/utils";

export function Page({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onEdit,
  editLabel,
  actions,
  align = "end",
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  actions?: ReactNode;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        align === "start" ? "flex-wrap items-start" : "items-end",
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-4xl">{title}</h1>
          {onEdit ? <EditButton label={editLabel ?? `Edit ${title}`} onClick={onEdit} /> : null}
        </div>
        {subtitle}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
