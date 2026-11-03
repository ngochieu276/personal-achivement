"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddProgressForm } from "@/components/subjects/AddProgressForm";
import { EditButton } from "@/components/shared/EditButton";
import { ExceedFlame } from "@/components/shared/ExceedFlame";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ResourceLink } from "@/components/shared/ResourceLink";
import { RemainingBadge, StreakWithCycles } from "@/components/subjects/StreakBadge";
import { SubjectStatusBadge } from "@/components/subjects/SubjectStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { EntityIcon } from "@/lib/icons";
import { periodLabel, unitLabel } from "@/lib/format";
import { typeOfRecordLabel } from "@/lib/record";
import { exceedAmount, latestRecordNumber } from "@/lib/subjects";
import { cn } from "@/lib/utils";
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
  const { t } = useI18n();
  const router = useRouter();
  const unit = unitLabel(subject.kpiType);
  const period = periodLabel(subject.kpiTypePeriod);
  const latest = latestRecordNumber(subject);
  const recordLabel = subject.typeOfRecord
    ? `${typeOfRecordLabel(subject.typeOfRecord)}${latest != null ? ` · ${latest}` : ""}`
    : null;
  const exceed = exceedAmount(subject.currentProgress, subject.kpi);
  const editLabel = t("common.editNamed", { name: subject.name });

  function openSubject() {
    router.push(`/subjects/${subject.id}`);
  }

  const meta = (
    <>
      <ExceedFlame exceed={exceed} />
      <StreakWithCycles
        streak={subject.currentStreak}
        finished={subject.finishedCycles}
        total={subject.totalCycles}
      />
      {subject.activeWindow ? <RemainingBadge end={subject.activeWindow.end} /> : null}
    </>
  );

  const addForm = (
    <AddProgressForm
      compact
      subjectId={subject.id}
      projectId={subject.projectId}
      kpiType={subject.kpiType}
      subjectName={subject.name}
      subjectIcon={subject.icon}
    />
  );

  if (variant === "list") {
    return (
      <Card
        className="min-w-0 max-w-full cursor-pointer overflow-hidden transition-colors hover:bg-muted/40"
        onClick={openSubject}
      >
        <CardHeader className="gap-3 p-4 md:flex-row md:items-center md:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <EntityIcon name={subject.icon} className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <span className="min-w-0 flex-1">
              <CardTitle className="flex flex-wrap items-center gap-1.5 break-words leading-snug">
                {subject.isPriority ? <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
                <span className="min-w-0 break-words">{subject.name}</span>
                <SubjectStatusBadge status={subject.status} comment={subject.statusComment} />
              </CardTitle>
              <CardDescription className="break-words">
                {period} · {subject.currentProgress} / {subject.kpi} {unit}
                {recordLabel ? ` · ${recordLabel}` : ""}
              </CardDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-1 md:hidden">{meta}</div>
            </span>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {meta}
            <ProgressBar current={subject.currentProgress} target={subject.kpi} size="inline" />
          </div>
          <div className="min-w-0 md:hidden">
            <ProgressBar current={subject.currentProgress} target={subject.kpi} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 md:shrink-0">
            {addForm}
            <EditButton label={editLabel} onClick={() => onEdit(subject)} />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className="min-w-0 max-w-full cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5"
      onClick={openSubject}
    >
      <CardHeader className="space-y-2 p-4 pb-3">
        <div className="flex min-w-0 items-start gap-2">
          <EntityIcon name={subject.icon} className="mt-1 h-5 w-5 shrink-0 text-secondary" />
          <CardTitle className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 break-words leading-snug">
            {subject.isPriority ? <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
            <span className="min-w-0 break-words">{subject.name}</span>
            <SubjectStatusBadge status={subject.status} comment={subject.statusComment} />
          </CardTitle>
          <EditButton label={editLabel} onClick={() => onEdit(subject)} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CardDescription className="min-w-0 break-words">
            {period} · {subject.kpi} {unit}
            {recordLabel ? ` · ${recordLabel}` : ""}
          </CardDescription>
          <div className={cn("flex flex-wrap items-center gap-1", "sm:ml-auto")}>{meta}</div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3 p-4 pt-0">
        <ProgressBar current={subject.currentProgress} target={subject.kpi} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {subject.currentProgress} / {subject.kpi} {unit}
          </span>
          {subject.link ? <ResourceLink href={subject.link} /> : null}
        </div>
        {addForm}
      </CardContent>
    </Card>
  );
}
