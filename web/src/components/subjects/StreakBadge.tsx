import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { remainingLabel } from "@/lib/format";

export function StreakBadge({
  streak,
  variant = "count",
}: {
  streak: number;
  variant?: "count" | "labeled";
}) {
  return (
    <Badge variant="outline" className="gap-1">
      <Flame className="h-3 w-3" />
      {variant === "labeled" ? `${streak} streak` : streak}
    </Badge>
  );
}

export function RemainingBadge({ end }: { end: string }) {
  return <Badge variant="secondary">{remainingLabel(end)}</Badge>;
}
