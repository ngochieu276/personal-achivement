import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimelineContent, TimelineItem } from "@/components/ui/timeline";
import { api } from "@/lib/api";
import { formatPeriodRange } from "@/lib/format";
import type { SubjectDetail, SubjectEvent, SubjectEventPatchResponse } from "@/lib/types";

export function PeriodTimelineItem({
  subjectId,
  projectId,
  event,
  unit,
}: {
  subjectId: string;
  projectId: string;
  event: SubjectEvent;
  unit: string;
}) {
  const queryClient = useQueryClient();
  const [kpi, setKpi] = useState(String(event.kpiSnapshot));
  const [progress, setProgress] = useState(String(event.progress));

  useEffect(() => {
    setKpi(String(event.kpiSnapshot));
    setProgress(String(event.progress));
  }, [event.kpiSnapshot, event.progress]);

  const save = useMutation({
    mutationFn: () =>
      api<SubjectEventPatchResponse>(`/subjects/${subjectId}/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          kpi: Number(kpi),
          progress: Number(progress),
        }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(
        ["subject-events", subjectId],
        (current: { events: SubjectEvent[] } | undefined) => {
          if (!current) return current;
          return {
            events: current.events.map((item) => (item.id === data.event.id ? data.event : item)),
          };
        },
      );
      queryClient.setQueryData(["subject", subjectId], (current: SubjectDetail | undefined) => {
        if (!current) return current;
        return {
          ...current,
          subject: { ...current.subject, currentStreak: data.currentStreak },
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const hit = event.status === "finish";
  const kpiValue = Number(kpi);
  const progressValue = Number(progress);
  const invalid =
    !Number.isFinite(kpiValue) ||
    kpiValue <= 0 ||
    !Number.isFinite(progressValue) ||
    progressValue < 0;
  const unchanged = kpiValue === event.kpiSnapshot && progressValue === event.progress;

  function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (unchanged || invalid) return;
    save.mutate();
  }

  return (
    <TimelineItem indicatorClassName={hit ? "bg-hit" : "bg-miss"}>
      <TimelineContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{formatPeriodRange(event.periodStart, event.periodEnd)}</p>
            <p className="text-sm text-muted-foreground">
              {event.progress} / {event.kpiSnapshot} {unit}
            </p>
          </div>
          <Badge variant={hit ? "hit" : "miss"}>{hit ? "Finished" : "Missed"}</Badge>
        </div>
        <ProgressBar current={event.progress} target={event.kpiSnapshot} />
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <div className="min-w-28 flex-1 space-y-1.5">
            <Label htmlFor={`kpi-${event.id}`}>Period KPI</Label>
            <Input
              id={`kpi-${event.id}`}
              type="number"
              min="0.1"
              step="0.1"
              value={kpi}
              onChange={(change) => setKpi(change.target.value)}
            />
          </div>
          <div className="min-w-28 flex-1 space-y-1.5">
            <Label htmlFor={`progress-${event.id}`}>Logged {unit}</Label>
            <Input
              id={`progress-${event.id}`}
              type="number"
              min="0"
              step="0.1"
              value={progress}
              onChange={(change) => setProgress(change.target.value)}
            />
          </div>
          <Button type="submit" disabled={save.isPending || unchanged || invalid}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </form>
        {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
      </TimelineContent>
    </TimelineItem>
  );
}
