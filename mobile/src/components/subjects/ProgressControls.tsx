import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pause, Play } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppModal } from "@/components/ui/Modal";
import { EntityIcon } from "@/lib/icons";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { unitLabel } from "@/lib/format";
import type { KpiType, SubjectDetail } from "@/lib/types";

async function invalidateProgress(queryClient: ReturnType<typeof useQueryClient>, subjectId: string, projectId: string, data: SubjectDetail) {
  queryClient.setQueryData(["subject", subjectId], data);
  await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
  await queryClient.invalidateQueries({ queryKey: ["activities"] });
}

export function AddProgressForm({
  subjectId,
  projectId,
  kpiType,
  subjectName,
  subjectIcon,
}: {
  subjectId: string;
  projectId: string;
  kpiType: KpiType;
  subjectName: string;
  subjectIcon?: string | null;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [add, setAdd] = useState("1");
  const [timerOpen, setTimerOpen] = useState(false);
  const unit = unitLabel(kpiType);
  const mutation = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ add: Number(add) }),
      }),
    onSuccess: async (data) => {
      await invalidateProgress(queryClient, subjectId, projectId, data);
      setAdd("1");
    },
  });

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Input className="flex-1" value={add} onChangeText={setAdd} keyboardType="decimal-pad" />
        <Button loading={mutation.isPending} onPress={() => mutation.mutate()}>
          {t("common.add")}
        </Button>
        {kpiType === "totalTime" ? (
          <Button variant="outline" onPress={() => setTimerOpen(true)}>
            {t("subjects.timer")}
          </Button>
        ) : null}
      </View>
      {mutation.error ? <Text className="text-sm text-destructive">{mutation.error.message}</Text> : null}
      <SubjectTimerDialog
        open={timerOpen}
        onOpenChange={setTimerOpen}
        subjectId={subjectId}
        projectId={projectId}
        subjectName={subjectName}
        subjectIcon={subjectIcon}
      />
    </View>
  );
}

export function SetProgressForm({
  subjectId,
  projectId,
  value,
  onChange,
  unit,
}: {
  subjectId: string;
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ currentProgress: Number(value) }),
      }),
    onSuccess: (data) => invalidateProgress(queryClient, subjectId, projectId, data),
  });
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Input className="flex-1" value={value} onChangeText={onChange} keyboardType="decimal-pad" />
        <Button loading={mutation.isPending} onPress={() => mutation.mutate()}>
          {t("subjects.setCurrentUnit", { unit })}
        </Button>
      </View>
      {mutation.error ? <Text className="text-sm text-destructive">{mutation.error.message}</Text> : null}
    </View>
  );
}

function formatHms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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
  const minutes = Math.round((elapsedMs / 60_000) * 100) / 100;

  useEffect(() => {
    if (!open || !running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [open, running]);

  const save = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ add: minutes }),
      }),
    onSuccess: async (data) => {
      await invalidateProgress(queryClient, subjectId, projectId, data);
      startedAt.current = null;
      setRunning(false);
      setBaseMs(0);
      onOpenChange(false);
    },
  });

  return (
    <AppModal open={open} onClose={() => onOpenChange(false)} title={t("subjects.timer")}>
      <View className="items-center gap-4">
        <View className="flex-row items-center gap-2">
          <EntityIcon name={subjectIcon} />
          <Text className="text-base text-foreground">{subjectName}</Text>
        </View>
        <Text className="font-serif text-4xl text-foreground">{formatHms(elapsedMs)}</Text>
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            onPress={() => {
              if (running) {
                if (startedAt.current) setBaseMs(baseMs + Date.now() - startedAt.current);
                startedAt.current = null;
                setRunning(false);
              } else {
                startedAt.current = Date.now();
                setNow(Date.now());
                setRunning(true);
              }
            }}
          >
            {running ? <Pause size={16} color="#384959" /> : <Play size={16} color="#384959" />}
            <Text className="text-foreground">{running ? t("subjects.timerPause") : t("subjects.timerStart")}</Text>
          </Button>
          <Button loading={save.isPending} disabled={minutes <= 0} onPress={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </View>
        {save.error ? <Text className="text-sm text-destructive">{save.error.message}</Text> : null}
      </View>
    </AppModal>
  );
}
