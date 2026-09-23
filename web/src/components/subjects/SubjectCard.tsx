import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddProgressForm } from "@/components/subjects/AddProgressForm";
import { EditButton } from "@/components/shared/EditButton";
import { ExceedFlame } from "@/components/shared/ExceedFlame";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ResourceLink } from "@/components/shared/ResourceLink";
import { RemainingBadge, StreakBadge } from "@/components/subjects/StreakBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityIcon } from "@/lib/icons";
import { periodLabels, unitLabel } from "@/lib/format";
import { typeOfRecordLabels } from "@/lib/record";
import { exceedAmount, latestRecordNumber } from "@/lib/subjects";
import type { Subject } from "@/lib/types";
import type { ViewMode } from "@/stores/view";

export function SubjectCard({
  subject,
  variant,
  onEdit,
}: {
  subject: Subject;
  variant: ViewMode;
  onEdit: (subject: Subject) => void;
}) {
  const navigate = useNavigate();
  const unit = unitLabel(subject.kpiType);
  const period = periodLabels[subject.kpiTypePeriod];
  const latest = latestRecordNumber(subject);
  const recordLabel = subject.typeOfRecord
    ? `${typeOfRecordLabels[subject.typeOfRecord]}${latest != null ? ` · ${latest}` : ""}`
    : null;
  const exceed = exceedAmount(subject.currentProgress, subject.kpi);

  function openSubject() {
    navigate(`/subjects/${subject.id}`);
  }

  if (variant === "list") {
    return (
      <Card className="cursor-pointer transition-colors hover:bg-muted/40" onClick={openSubject}>
        <CardHeader className="flex-row items-center gap-4 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <EntityIcon name={subject.icon} className="h-5 w-5 shrink-0 text-secondary" />
            <span className="min-w-0">
              <CardTitle className="flex items-center gap-1.5">
                {subject.isPriority ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : null}
                {subject.name}
              </CardTitle>
              <CardDescription>
                {period} · {subject.currentProgress} / {subject.kpi} {unit}
                {recordLabel ? ` · ${recordLabel}` : ""}
              </CardDescription>
            </span>
          </div>
          <ProgressBar current={subject.currentProgress} target={subject.kpi} size="inline" />
          <ExceedFlame exceed={exceed} />
          <StreakBadge streak={subject.currentStreak} />
          <AddProgressForm
            compact
            subjectId={subject.id}
            projectId={subject.projectId}
            kpiType={subject.kpiType}
          />
          <EditButton label={`Edit ${subject.name}`} onClick={() => onEdit(subject)} />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={openSubject}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <EntityIcon name={subject.icon} className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <span className="min-w-0">
              <CardTitle className="flex items-center gap-1.5">
                {subject.isPriority ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : null}
                {subject.name}
              </CardTitle>
              <CardDescription>
                {period} · {subject.kpi} {unit}
                {recordLabel ? ` · ${recordLabel}` : ""}
              </CardDescription>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ExceedFlame exceed={exceed} />
            <StreakBadge streak={subject.currentStreak} />
            {subject.activeWindow ? <RemainingBadge end={subject.activeWindow.end} /> : null}
            <EditButton label={`Edit ${subject.name}`} onClick={() => onEdit(subject)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar current={subject.currentProgress} target={subject.kpi} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {subject.currentProgress} / {subject.kpi} {unit}
          </span>
          {subject.link ? <ResourceLink href={subject.link} /> : null}
        </div>
        <AddProgressForm
          compact
          subjectId={subject.id}
          projectId={subject.projectId}
          kpiType={subject.kpiType}
        />
      </CardContent>
    </Card>
  );
}
