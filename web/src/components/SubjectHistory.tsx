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
  const items = history.filter((item) => {
    if (item.type !== "kpi_done") return false;
    if (!periodStart) return true;
    return String(item.payload.periodStart ?? "") === periodStart;
  });

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No KPI done events yet this period.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-border pl-3">
          <p className="text-xs text-muted-foreground">{formatDateTime(firedAt(item))}</p>
          <p className="text-sm">{kpiDoneLabel(item, unit)}</p>
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
  return (
    <ol className="space-y-4">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No history yet. Track a period to start the log.</p>
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
  item: SubjectHistory;
  unit: string;
}) {
  if (item.type === "kpi_done") {
    return <p>{kpiDoneLabel(item, unit)}</p>;
  }
  if (item.type === "kpi_change") {
    return (
      <p>
        KPI updated from {String(item.payload.oldKpi)} to {String(item.payload.newKpi)} {unit}
      </p>
    );
  }
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
  return <p>Logged event</p>;
}

function kpiDoneLabel(item: SubjectHistory, unit: string) {
  const kind = String(item.payload.kind ?? "add");
  const amount = Number(item.payload.amount ?? 0);
  const total = Number(item.payload.total ?? 0);
  if (kind === "set") {
    return `Set current to ${total} ${unit}`;
  }
  return `Added ${amount} ${unit} · total ${total} ${unit}`;
}
