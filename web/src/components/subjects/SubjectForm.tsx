import { useEffect, useState, type FormEvent } from "react";
import { IconPicker } from "@/components/shared/IconPicker";
import { SubjectRecordFields } from "@/components/subjects/SubjectRecordFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alignCycleStart, cycleStartHint, toDateInput } from "@/lib/cycle";
import { formatDate } from "@/lib/format";
import { defaultBetterDirection } from "@/lib/record";
import type { BetterDirection, KpiType, KpiTypePeriod, Subject, TypeOfRecord } from "@/lib/types";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [kpi, setKpi] = useState(String(initial?.kpi ?? 10));
  const [kpiTypePeriod, setKpiTypePeriod] = useState<KpiTypePeriod>(
    initial?.kpiTypePeriod ?? "week",
  );
  const [kpiType, setKpiType] = useState<KpiType>(initial?.kpiType ?? "totalRepeat");
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? toDateInput(new Date()),
  );
  const [link, setLink] = useState(initial?.link ?? "");
  const [typeOfRecord, setTypeOfRecord] = useState<TypeOfRecord | "">(initial?.typeOfRecord ?? "");
  const [betterDirection, setBetterDirection] = useState<BetterDirection | "">(
    initial?.betterDirection ?? defaultBetterDirection(initial?.typeOfRecord ?? ""),
  );
  const [isPriority, setIsPriority] = useState(initial?.isPriority ?? false);

  const aligned = alignCycleStart(new Date(`${startDate}T00:00:00.000Z`), kpiTypePeriod);
  const alignedDate = toDateInput(aligned);

  useEffect(() => {
    if (alignedDate !== startDate) setStartDate(alignedDate);
  }, [alignedDate, startDate]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      name,
      icon,
      kpi: Number(kpi),
      kpiTypePeriod,
      kpiType,
      startDate: toDateInput(aligned),
      link,
      typeOfRecord: typeOfRecord || null,
      betterDirection: typeOfRecord
        ? typeOfRecord === "defineByUser"
          ? betterDirection || null
          : defaultBetterDirection(typeOfRecord) || null
        : null,
      isPriority,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="subject-name">Name</Label>
        <Input
          id="subject-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <IconPicker value={icon} onChange={setIcon} />
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
            <option value="totalRepeat">Total repeats</option>
            <option value="totalTime">Total time (minutes)</option>
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
          <Label htmlFor="start-date">In this cycle</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {cycleStartHint(kpiTypePeriod)} Cycle starts {formatDate(aligned.toISOString())}.
      </p>
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPriority}
          onChange={(event) => setIsPriority(event.target.checked)}
        />
        Priority subject
      </label>
      <SubjectRecordFields
        typeOfRecord={typeOfRecord}
        betterDirection={betterDirection}
        onTypeOfRecordChange={setTypeOfRecord}
        onBetterDirectionChange={setBetterDirection}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
