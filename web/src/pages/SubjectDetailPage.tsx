import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Flame, Pencil } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AddProgressForm } from "@/components/AddProgressForm";
import { SubjectForm, type SubjectFormValues } from "@/components/SubjectForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toDateInput } from "@/lib/cycle";
import { formatDate, formatDateTime, periodLabels, remainingLabel, unitLabel } from "@/lib/format";
import type { SubjectDetail } from "@/lib/types";

export function SubjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState("");
  const [editing, setEditing] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["subject", id],
    queryFn: () => api<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setProgress(String(detailQuery.data.subject.currentProgress));
  }, [detailQuery.data]);

  const saveProgress = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${id}/progress`, {
        method: "PUT",
        body: JSON.stringify({ currentProgress: Number(progress) }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
    },
  });

  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      setEditing(false);
    },
  });

  function onProgress(event: FormEvent) {
    event.preventDefault();
    saveProgress.mutate();
  }

  if (detailQuery.isLoading) {
    return <p className="text-muted-foreground">Loading subject...</p>;
  }
  if (!detailQuery.data) {
    return <p className="text-destructive">Subject not found.</p>;
  }

  const { subject, activeWindow, history } = detailQuery.data;
  const ratio = Math.min(1, subject.currentProgress / subject.kpi);

  return (
    <div className="space-y-6">
      <Link
        to={`/projects/${subject.projectId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to project
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subject</p>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-4xl">{subject.name}</h1>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Edit subject"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground">
            {periodLabels[subject.kpiTypePeriod]} · cycle started {formatDate(subject.startDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Flame className="h-3 w-3" />
            {subject.currentStreak} streak
          </Badge>
          <Badge variant="secondary">{remainingLabel(activeWindow.end)}</Badge>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit subject</DialogTitle>
          </DialogHeader>
          <SubjectForm
            key={subject.id}
            initial={{
              name: subject.name,
              kpi: subject.kpi,
              kpiTypePeriod: subject.kpiTypePeriod,
              kpiType: subject.kpiType,
              startDate: toDateInput(new Date(subject.startDate)),
              link: subject.link ?? "",
            }}
            submitLabel="Save subject"
            pending={updateSubject.isPending}
            error={updateSubject.error?.message}
            onSubmit={(values) => updateSubject.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>This period</CardTitle>
            <CardDescription>
              Set the total so far, or add what you just finished. Finish fires if current is at least the KPI when the window ends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${ratio >= 1 ? "bg-hit" : "bg-primary"}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {subject.currentProgress} / {subject.kpi} {unitLabel(subject.kpiType)}
            </p>
            <form className="flex items-end gap-3" onSubmit={onProgress}>
              <div className="flex-1 space-y-2">
                <Label htmlFor="progress">Set current {unitLabel(subject.kpiType)}</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  step="0.1"
                  value={progress}
                  onChange={(event) => setProgress(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={saveProgress.isPending}>
                Save
              </Button>
            </form>
            {saveProgress.error ? (
              <p className="text-sm text-destructive">{saveProgress.error.message}</p>
            ) : null}
            <div className="space-y-2">
              <Label>Add {unitLabel(subject.kpiType)} done</Label>
              <AddProgressForm
                subjectId={subject.id}
                projectId={subject.projectId}
                kpiType={subject.kpiType}
              />
            </div>
            {subject.link ? (
              <a
                href={subject.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Open linked resource
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPI</CardTitle>
            <CardDescription>
              {periodLabels[subject.kpiTypePeriod]} · {subject.kpi} {unitLabel(subject.kpiType)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Edit name, measure, period, cycle, and target from the pencil next to the title.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Period results, streak hits, and KPI changes.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet. Track a period to start the log.</p>
          ) : (
            <ol className="space-y-4">
              {history.map((item) => (
                <li key={item.id} className="border-l-2 border-border pl-4">
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                  <HistoryLine item={item} unit={unitLabel(subject.kpiType)} />
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryLine({
  item,
  unit,
}: {
  item: SubjectDetail["history"][number];
  unit: string;
}) {
  if (item.type === "subject_event") {
    const status = String(item.payload.status ?? "");
    const progress = Number(item.payload.progress ?? 0);
    const kpi = Number(item.payload.kpi ?? 0);
    return (
      <p>
        Period {status === "finish" ? "finished" : "missed"}: {progress} / {kpi} {unit}
      </p>
    );
  }
  if (item.type === "streak_hit") {
    return <p>Streak hit: {String(item.payload.streak ?? 0)}</p>;
  }
  return (
    <p>
      KPI changed from {String(item.payload.oldKpi)} to {String(item.payload.newKpi)} {unit}
    </p>
  );
}
