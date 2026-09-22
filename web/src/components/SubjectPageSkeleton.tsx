import { Page } from "@/components/PageHeader";
import { PageLoading } from "@/components/PageLoading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SubjectPageSkeleton() {
  return (
    <Page>
      <Skeleton className="h-4 w-28" />
      <PageLoading label="Loading subject...">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
        <CardSkeleton lines={2} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </PageLoading>
    </Page>
  );
}

function CardSkeleton({ lines }: { lines: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
