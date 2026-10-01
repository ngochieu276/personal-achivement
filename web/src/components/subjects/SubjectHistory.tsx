"use client";

import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import type { SubjectDetail, SubjectHistory } from "@/lib/types";

function firedAt(item: SubjectHistory) {
  const value = item.payload.firedAt;
  return typeof value === "string" ? value : item.createdAt;
}

export function KpiDoneList({
  history,
  periodStart,
  unit,
}: {
  history: SubjectHistory[];
  periodStart?: string;
  unit: string;
}) {
  const { t } = useI18n();
  const items = history.filter((item) => {
    if (item.type !== "kpi_done") return false;
    if (!periodStart) return true;
    return String(item.payload.periodStart ?? "") === periodStart;
  });

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("subjects.noKpiDone")}</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-border pl-3">
          <p className="text-xs text-muted-foreground">{formatDateTime(firedAt(item))}</p>
          <div className="text-sm">
            <HistoryLine item={item} unit={unit} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SubjectHistory({
  history,
  unit,
}: {
  history: SubjectDetail["history"];
  unit: string;
}) {
  const { t } = useI18n();
  return (
    <ol className="space-y-4">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("subjects.noHistory")}</p>
      ) : (
        history.map((item) => (
          <li key={item.id} className="border-l-2 border-border pl-4">
            <p className="text-xs text-muted-foreground">{formatDateTime(firedAt(item))}</p>
            <HistoryLine item={item} unit={unit} />
          </li>
        ))
      )}
    </ol>
  );
}

export function HistoryLine({
  item,
  unit,
}: {
  item: Pick<SubjectHistory, "type" | "payload">;
  unit: string;
}) {
  const { t } = useI18n();
  if (item.type === "kpi_done") {
    const kind = String(item.payload.kind ?? "add");
    const amount = Number(item.payload.amount ?? 0);
    const total = Number(item.payload.total ?? 0);
    if (kind === "set") {
      return <p>{t("subjects.setCurrent", { total, unit })}</p>;
    }
    return <p>{t("subjects.addedProgress", { amount, unit, total })}</p>;
  }
  if (item.type === "kpi_change") {
    return (
      <p>
        {t("subjects.kpiUpdated", {
          old: String(item.payload.oldKpi),
          new: String(item.payload.newKpi),
          unit,
        })}
      </p>
    );
  }
  if (item.type === "subject_event") {
    const status = String(item.payload.status ?? "");
    const progress = Number(item.payload.progress ?? 0);
    const kpi = Number(item.payload.kpi ?? 0);
    return (
      <p>
        {status === "finish"
          ? t("subjects.periodFinished", { progress, kpi, unit })
          : t("subjects.periodMissed", { progress, kpi, unit })}
      </p>
    );
  }
  if (item.type === "streak_hit") {
    return <p>{t("subjects.streakHit", { streak: String(item.payload.streak ?? 0) })}</p>;
  }
  return <p>{t("subjects.loggedEvent")}</p>;
}
