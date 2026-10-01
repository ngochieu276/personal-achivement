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

export function RemainingBadge({ end }: { end: string }) {
  useI18n();
  return <Badge variant="secondary">{remainingLabel(end)}</Badge>;
}
