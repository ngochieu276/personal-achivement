import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Flame, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { periodLabels, remainingLabel, unitLabel } from "@/lib/format";
import type { KpiType, KpiTypePeriod, Project, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProjectDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kpi, setKpi] = useState("30");
  const [kpiTypePeriod, setKpiTypePeriod] = useState<KpiTypePeriod>("week");
  const [kpiType, setKpiType] = useState<KpiType>("totalTime");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [link, setLink] = useState("");

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`),
    enabled: Boolean(id),
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects", id],
    queryFn: () => api<{ subjects: Subject[] }>(`/projects/${id}/subjects`),
    enabled: Boolean(id),
  });

  const createSubject = useMutation({
    mutationFn: () =>
      api(`/projects/${id}/subjects`, {
        method: "POST",
        body: JSON.stringify({
          name,
          kpi: Number(kpi),
          kpiTypePeriod,
          kpiType,
          startDate,
          link,
        }),
      }),
    onSuccess: async () => {
      setOpen(false);
      setName("");
      setLink("");
      await queryClient.invalidateQueries({ queryKey: ["subjects", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createSubject.mutate();
  }

  const subjects = subjectsQuery.data?.subjects ?? [];

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
          <h1 className="font-serif text-4xl">{projectQuery.data?.project.name ?? "Loading"}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New subject</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="subject-name">Name</Label>
                <Input
                  id="subject-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kpi">KPI</Label>
                  <Input
                    id="kpi"
                    type="number"
                    min="1"
                    step="0.1"
                    value={kpi}
                    onChange={(event) => setKpi(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kpi-type">Measure</Label>
                  <select
                    id="kpi-type"
                    className={selectClass}
                    value={kpiType}
                    onChange={(event) => setKpiType(event.target.value as KpiType)}
                  >
                    <option value="totalTime">Total time (minutes)</option>
                    <option value="totalRepeat">Total repeats</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <select
                    id="period"
                    className={selectClass}
                    value={kpiTypePeriod}
                    onChange={(event) => setKpiTypePeriod(event.target.value as KpiTypePeriod)}
                  >
                    <option value="day">Per day</option>
                    <option value="week">Per week</option>
                    <option value="twoWeek">Per 2 weeks</option>
                    <option value="month">Per month</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                />
              </div>
              {createSubject.error ? (
                <p className="text-sm text-destructive">{createSubject.error.message}</p>
              ) : null}
              <Button type="submit" disabled={createSubject.isPending}>
                Create subject
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjectsQuery.isLoading ? (
        <p className="text-muted-foreground">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No subjects yet</CardTitle>
            <CardDescription>
              Add a subject with a KPI. Track the current period, then the API records finish or miss when it ends.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subjects.map((subject) => {
            const ratio = Math.min(1, subject.currentProgress / subject.kpi);
            return (
              <Link key={subject.id} to={`/subjects/${subject.id}`}>
                <Card className="transition-transform hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>
                          {periodLabels[subject.kpiTypePeriod]} · {subject.kpi} {unitLabel(subject.kpiType)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Flame className="h-3 w-3" />
                          {subject.currentStreak}
                        </Badge>
                        {subject.activeWindow ? (
                          <Badge variant="secondary">{remainingLabel(subject.activeWindow.end)}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          ratio >= 1 ? "bg-hit" : "bg-primary",
                        )}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {subject.currentProgress} / {subject.kpi} {unitLabel(subject.kpiType)}
                      </span>
                      {subject.link ? (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
