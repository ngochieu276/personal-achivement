import { Skeleton } from "@/components/ui/skeleton";

export function DetailHeaderSkeleton({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <Skeleton className="h-9 w-40 sm:h-10 sm:w-56" />
        <Skeleton className="h-4 w-28 sm:w-36" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-10 w-10 sm:w-28" />
      </div>
    </div>
  );
}
