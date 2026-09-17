import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Flame } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, periodLabels, remainingLabel, unitLabel } from "@/lib/format";
import type { SubjectDetail } from "@/lib/types";

export function SubjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState("");
  const [kpi, setKpi] = useState("");

  const detailQuery = useQuery({
    queryKey: ["subject", id],
    queryFn: () => api<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setProgress(String(detailQuery.data.subject.currentProgress));
    setKpi(String(detailQuery.data.subject.kpi));
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

  const saveKpi = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ kpi: Number(kpi) }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", id], data);
    },
  });

  function onProgress(event: FormEvent) {
    event.preventDefault();
    saveProgress.mutate();
  }

  function onKpi(event: FormEvent) {
    event.preventDefault();
    saveKpi.mutate();
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
          <h1 className="font-serif text-4xl">{subject.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {periodLabels[subject.kpiTypePeriod]} · started {formatDate(subject.startDate)}
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

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>This period</CardTitle>
            <CardDescription>
              Set how much you have finished so far. When the window ends, finish fires if current is at least the KPI.
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
                <Label htmlFor="progress">Current {unitLabel(subject.kpiType)}</Label>
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
            <CardDescription>Changing this writes a KPI change to history.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex items-end gap-3" onSubmit={onKpi}>
              <div className="flex-1 space-y-2">
                <Label htmlFor="kpi">Target {unitLabel(subject.kpiType)}</Label>
                <Input
                  id="kpi"
                  type="number"
                  min="1"
                  step="0.1"
                  value={kpi}
                  onChange={(event) => setKpi(event.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={saveKpi.isPending}>
                Update
              </Button>
            </form>
            {saveKpi.error ? (
              <p className="mt-3 text-sm text-destructive">{saveKpi.error.message}</p>
            ) : null}
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
