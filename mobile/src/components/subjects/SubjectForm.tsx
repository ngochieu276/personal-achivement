import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { IconPicker } from "@/components/shared/IconPicker";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { alignCycleStart, cycleStartHint, toDateInput } from "@/lib/cycle";
import { formatDate } from "@/lib/format";
import { BETTER_DIRECTION, defaultBetterDirection, TYPE_OF_RECORD, typeOfRecordKeys } from "@/lib/record";
import type { BetterDirection, KpiType, KpiTypePeriod, Project, Subject, TypeOfRecord } from "@/lib/types";

export type SubjectFormValues = {
  name: string;
  icon: string;
  kpi: number;
  kpiTypePeriod: KpiTypePeriod;
  kpiType: KpiType;
  startDate: string;
  link: string;
  typeOfRecord: TypeOfRecord | null;
  betterDirection: BetterDirection | null;
  isPriority: boolean;
  projectId?: string;
};

export function subjectToFormValues(subject: Subject): SubjectFormValues {
  return {
    name: subject.name,
    icon: subject.icon ?? "",
    kpi: subject.kpi,
    kpiTypePeriod: subject.kpiTypePeriod,
    kpiType: subject.kpiType,
    startDate: toDateInput(new Date(subject.startDate)),
    link: subject.link ?? "",
    typeOfRecord: subject.typeOfRecord ?? null,
    betterDirection: subject.betterDirection ?? null,
    isPriority: subject.isPriority ?? false,
    projectId: subject.projectId,
  };
}

export function SubjectForm({
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
}: {
  initial?: Partial<SubjectFormValues>;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onSubmit: (values: SubjectFormValues) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [kpi, setKpi] = useState(String(initial?.kpi ?? 10));
  const [kpiTypePeriod, setKpiTypePeriod] = useState<KpiTypePeriod>(initial?.kpiTypePeriod ?? "week");
  const [kpiType, setKpiType] = useState<KpiType>(initial?.kpiType ?? "totalRepeat");
  const [startDate, setStartDate] = useState(initial?.startDate ?? toDateInput(new Date()));
  const [link, setLink] = useState(initial?.link ?? "");
  const [typeOfRecord, setTypeOfRecord] = useState<TypeOfRecord | "">(initial?.typeOfRecord ?? "");
  const [betterDirection, setBetterDirection] = useState<BetterDirection | "">(
    initial?.betterDirection ?? defaultBetterDirection(initial?.typeOfRecord ?? ""),
  );
  const [isPriority, setIsPriority] = useState(initial?.isPriority ?? false);
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const canMove = Boolean(initial?.projectId);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
    enabled: canMove,
  });
  const projects = projectsQuery.data?.projects ?? [];
  const aligned = alignCycleStart(new Date(`${startDate}T00:00:00.000Z`), kpiTypePeriod);
  const alignedDate = toDateInput(aligned);

  useEffect(() => {
    if (alignedDate !== startDate) setStartDate(alignedDate);
  }, [alignedDate, startDate]);

  return (
    <View className="gap-4">
      <View>
        <Label>{t("common.name")}</Label>
        <Input value={name} onChangeText={setName} />
      </View>
      <IconPicker value={icon} onChange={setIcon} />
      {canMove && projects.length > 0 ? (
        <View>
          <Label>{t("subjects.project")}</Label>
          <Select
            value={projectId}
            onChange={setProjectId}
            options={projects.map((project) => ({ value: project.id, label: project.name }))}
          />
        </View>
      ) : null}
      <View>
        <Label>{t("subjects.kpi")}</Label>
        <Input value={kpi} onChangeText={setKpi} keyboardType="decimal-pad" />
      </View>
      <View>
        <Label>{t("subjects.measure")}</Label>
        <Select
          value={kpiType}
          onChange={setKpiType}
          options={[
            { value: "totalRepeat", label: t("subjects.totalRepeat") },
            { value: "totalTime", label: t("subjects.totalTime") },
          ]}
        />
      </View>
      <View>
        <Label>{t("subjects.period")}</Label>
        <Select
          value={kpiTypePeriod}
          onChange={setKpiTypePeriod}
          options={[
            { value: "day", label: t("period.day") },
            { value: "week", label: t("period.week") },
            { value: "twoWeek", label: t("period.twoWeek") },
            { value: "month", label: t("period.month") },
          ]}
        />
        <Text className="mt-1 text-xs text-muted-foreground">{cycleStartHint(kpiTypePeriod)}</Text>
      </View>
      <View>
        <Label>{t("common.date")}</Label>
        <Input value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <Text className="mt-1 text-xs text-muted-foreground">
          {t("subjects.cycleStarts", { date: formatDate(`${alignedDate}T00:00:00.000Z`) })}
        </Text>
      </View>
      <View>
        <Label>{t("subjects.linkOptional")}</Label>
        <Input value={link} onChangeText={setLink} autoCapitalize="none" />
      </View>
      <View>
        <Label>{t("subjects.typeOfRecord")}</Label>
        <Select
          value={typeOfRecord || ""}
          onChange={(value) => {
            setTypeOfRecord(value as TypeOfRecord | "");
            setBetterDirection(defaultBetterDirection((value as TypeOfRecord) || "") || "");
          }}
          options={[
            { value: "", label: t("common.none") },
            ...TYPE_OF_RECORD.map((type) => ({ value: type, label: t(typeOfRecordKeys[type]) })),
          ]}
        />
      </View>
      {typeOfRecord === "defineByUser" ? (
        <View>
          <Label>{t("subjects.betterDirection")}</Label>
          <Select
            value={betterDirection || "higherIsBetter"}
            onChange={(value) => setBetterDirection(value as BetterDirection)}
            options={BETTER_DIRECTION.map((direction) => ({
              value: direction,
              label: direction === "lowerIsBetter" ? t("subjects.lowerIsBetter") : t("subjects.higherIsBetter"),
            }))}
          />
        </View>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">{t("subjects.priority")}</Text>
        <Switch value={isPriority} onValueChange={setIsPriority} />
      </View>
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button
        loading={pending}
        disabled={!name.trim() || !Number(kpi)}
        onPress={() =>
          onSubmit({
            name,
            icon,
            kpi: Number(kpi),
            kpiTypePeriod,
            kpiType,
            startDate: alignedDate,
            link,
            typeOfRecord: typeOfRecord || null,
            betterDirection: typeOfRecord
              ? typeOfRecord === "defineByUser"
                ? betterDirection || null
                : defaultBetterDirection(typeOfRecord) || null
              : null,
            isPriority,
            ...(canMove && projectId ? { projectId } : {}),
          })
        }
      >
        {pending ? t("common.saving") : submitLabel}
      </Button>
    </View>
  );
}
