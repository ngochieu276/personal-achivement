"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { recurrenceFromStart, toDateTimeLocal } from "@/lib/calendar";
import type { CalendarRecurrence, CalendarTask, Project } from "@/lib/types";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Frequency = "none" | CalendarRecurrence["frequency"];

export function CalendarTaskDialog({
  open,
  onOpenChange,
  task,
  startsAt,
  endsAt,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CalendarTask | null;
  startsAt: Date;
  endsAt: Date;
  projects: Project[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setProjectId(task?.projectId ?? projects[0]?.id ?? "");
    setStart(toDateTimeLocal(startsAt));
    setEnd(toDateTimeLocal(endsAt));
    setFrequency(task?.recurrence?.frequency ?? "none");
    setConfirmDelete(false);
  }, [endsAt, open, projects, startsAt, task]);

  const save = useMutation({
    mutationFn: () => {
      const startDate = new Date(start);
      const body = {
        title,
        projectId,
        startsAt: startDate.toISOString(),
        endsAt: new Date(end).toISOString(),
        recurrence: recurrenceFromStart(frequency, startDate),
      };
      if (task) {
        return api<{ calendarTask: CalendarTask }>(`/calendar-tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return api<{ calendarTask: CalendarTask }>("/calendar-tasks", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      onOpenChange(false);
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/calendar-tasks/${task!.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      setConfirmDelete(false);
      onOpenChange(false);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={task ? t("calendar.editTask") : t("calendar.newTask")}
      >
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("calendar.emptyProject")}</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="calendar-title">{t("calendar.taskTitle")}</Label>
              <Input id="calendar-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendar-project">{t("subjects.project")}</Label>
              <select
                id="calendar-project"
                className={selectClass}
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calendar-start">{t("calendar.start")}</Label>
                <Input
                  id="calendar-start"
                  type="datetime-local"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-end">{t("calendar.end")}</Label>
                <Input
                  id="calendar-end"
                  type="datetime-local"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendar-recurrence">{t("calendar.recurrence")}</Label>
              <select
                id="calendar-recurrence"
                className={selectClass}
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as Frequency)}
              >
                <option value="none">{t("calendar.recurrenceNone")}</option>
                <option value="daily">{t("calendar.recurrenceDaily")}</option>
                <option value="weekly">{t("calendar.recurrenceWeekly")}</option>
                <option value="monthly">{t("calendar.recurrenceMonthly")}</option>
              </select>
            </div>
            {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
            <div className="flex items-center justify-between gap-2">
              {task ? (
                <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                  {t("calendar.deleteTaskBtn")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={save.isPending || !projectId}>
                  {save.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </div>
          </form>
        )}
      </FormDialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("calendar.deleteTask")}
        description={t("calendar.deleteTaskDesc")}
        confirmLabel={remove.isPending ? t("common.deleting") : t("calendar.deleteTaskBtn")}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
