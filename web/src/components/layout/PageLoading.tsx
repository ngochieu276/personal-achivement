import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

export function PageLoading({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label={label}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
