"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { remainingLabel } from "@/lib/format";

export function StreakBadge({
  streak,
  variant = "count",
}: {
  streak: number;
  variant?: "count" | "labeled";
}) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className="gap-1">
      <Flame className="h-3 w-3 fill-streak text-streak" />
      {variant === "labeled" ? t("time.streak", { count: streak }) : streak}
    </Badge>
  );
}

export function CycleRatioBadge({
  finished = 0,
  total = 0,
}: {
  finished?: number;
  total?: number;
}) {
  const { t } = useI18n();
  return (
    <Badge
      variant="outline"
      className="tabular-nums"
      title={t("time.finishedCycles", { finished, total })}
    >
      {finished}/{total}
    </Badge>
  );
}

export function StreakWithCycles({
  streak,
  finished,
  total,
  variant = "count",
}: {
  streak: number;
  finished?: number;
  total?: number;
  variant?: "count" | "labeled";
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <StreakBadge streak={streak} variant={variant} />
      <CycleRatioBadge finished={finished} total={total} />
    </span>
  );
}

export function RemainingBadge({ end }: { end: string }) {
  useI18n();
  return <Badge variant="secondary">{remainingLabel(end)}</Badge>;
}
