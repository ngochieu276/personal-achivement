import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Timeline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ol className={cn("relative", className)}>{children}</ol>;
}

export function TimelineItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("group relative flex gap-3 pb-6 last:pb-0", className)}>
      <div className="flex flex-col items-center">
        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-background" />
        <span className="w-px flex-1 bg-border group-last:hidden" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export function TimelineContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}
