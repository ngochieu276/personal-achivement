"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";
import type { SubjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SubjectStatusBadge({
  status,
  comment,
}: {
  status?: SubjectStatus | null;
  comment?: string | null;
}) {
  const { t } = useI18n();
  if (!status || status === "active") return null;

  const label = status === "pending" ? t("subjects.statusPending") : t("subjects.statusEnding");
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "uppercase tracking-wide",
        status === "pending" && "border-streak/40 bg-streak/10 text-streak",
        status === "ending" && "border-miss/40 bg-miss/10 text-miss",
      )}
    >
      {label}
    </Badge>
  );

  if (!comment) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{comment}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
