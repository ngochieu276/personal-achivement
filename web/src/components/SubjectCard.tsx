import { Link } from "react-router-dom";
import { AddProgressForm } from "@/components/AddProgressForm";
import { EditButton } from "@/components/EditButton";
import { ProgressBar } from "@/components/ProgressBar";
import { ResourceLink } from "@/components/ResourceLink";
import { RemainingBadge, StreakBadge } from "@/components/StreakBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { periodLabels, unitLabel } from "@/lib/format";
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
  const unit = unitLabel(subject.kpiType);
  const period = periodLabels[subject.kpiTypePeriod];

  if (variant === "list") {
    return (
      <Card>
        <CardHeader className="flex-row items-center gap-4 p-4">
          <Link to={`/subjects/${subject.id}`} className="min-w-0 flex-1">
            <CardTitle className="hover:underline">{subject.name}</CardTitle>
            <CardDescription>
              {period} · {subject.currentProgress} / {subject.kpi} {unit}
            </CardDescription>
          </Link>
          <ProgressBar current={subject.currentProgress} target={subject.kpi} size="inline" />
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
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/subjects/${subject.id}`} className="min-w-0">
            <CardTitle className="hover:underline">{subject.name}</CardTitle>
            <CardDescription>
              {period} · {subject.kpi} {unit}
            </CardDescription>
          </Link>
          <div className="flex items-center gap-1">
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
