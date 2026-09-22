import { Skeleton } from "@/components/ui/skeleton";

export function DetailHeaderSkeleton({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
