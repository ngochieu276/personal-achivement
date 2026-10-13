"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { EntityIcon } from "@/lib/icons";
import type { SubjectDetail } from "@/lib/types";

function formatHms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function elapsedMinutes(ms: number) {
  return Math.round((ms / 60_000) * 100) / 100;
}

export function SubjectTimerDialog({
  open,
  onOpenChange,
  subjectId,
  projectId,
  subjectName,
  subjectIcon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  projectId: string;
  subjectName: string;
  subjectIcon?: string | null;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [baseMs, setBaseMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const startedAt = useRef<number | null>(null);

  const elapsedMs = running && startedAt.current != null ? baseMs + (now - startedAt.current) : baseMs;
  const minutes = elapsedMinutes(elapsedMs);

  useEffect(() => {
    if (!open || !running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [open, running]);

  function start() {
    if (running) return;
    startedAt.current = Date.now();
    setNow(Date.now());
    setRunning(true);
  }

  function currentElapsed() {
    if (running && startedAt.current != null) return baseMs + Date.now() - startedAt.current;
    return baseMs;
  }

  function pause() {
    if (!running || startedAt.current == null) return;
    setBaseMs(currentElapsed());
    startedAt.current = null;
    setRunning(false);
  }

  function reset() {
    startedAt.current = null;
    setRunning(false);
    setBaseMs(0);
  }

  const save = useMutation({
    mutationFn: (add: number) =>
      api<SubjectDetail>(`/subjects/${subjectId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ add }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      reset();
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) pause();
        onOpenChange(next);
      }}
      title={t("subjects.timer")}
    >
      <div className="space-y-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-center gap-2 text-center">
          <EntityIcon name={subjectIcon} className="h-6 w-6 shrink-0 text-secondary" />
          <p className="font-serif text-xl leading-tight">{subjectName}</p>
        </div>
        <p className="text-center font-serif text-5xl tabular-nums tracking-wide">{formatHms(elapsedMs)}</p>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" disabled={running} onClick={start}>
            <Play className="h-4 w-4" />
            {t("subjects.timerStart")}
          </Button>
          <Button type="button" variant="outline" disabled={!running} onClick={pause}>
            <Pause className="h-4 w-4" />
            {t("subjects.timerPause")}
          </Button>
          <Button
            type="button"
            disabled={minutes <= 0 || save.isPending}
            onClick={() => {
              const add = elapsedMinutes(currentElapsed());
              pause();
              if (add <= 0) return;
              save.mutate(add);
            }}
          >
            <Save className="h-4 w-4" />
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
        {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
      </div>
    </FormDialog>
  );
}
