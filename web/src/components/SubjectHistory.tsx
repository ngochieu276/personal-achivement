import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { SubjectDetail } from "@/lib/types";

export function SubjectHistory({
  history,
  unit,
}: {
  history: SubjectDetail["history"];
  unit: string;
}) {
  return (
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
                <HistoryLine item={item} unit={unit} />
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
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
