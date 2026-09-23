import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { viewClass } from "@/components/layout/ViewToggle";
import { useViewStore, type ViewMode } from "@/stores/view";

export function CardListSkeleton({
  count = 4,
  kind,
}: {
  count?: number;
  kind: "projects" | "subjects";
}) {
  const mode = useViewStore((state) => state.mode);

  return (
    <div className={viewClass(mode, kind)}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} variant={mode} />
      ))}
    </div>
  );
}

function CardSkeleton({ variant }: { variant: ViewMode }) {
  if (variant === "list") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <Skeleton className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
    </Card>
  );
}
