import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

export function StatCards({ summary }: { summary: DashboardStats["summary"] }) {
  const items = [
    { label: "On track", value: `${summary.onTrack}`, hint: "Hit KPI this cycle" },
    { label: "At risk", value: `${summary.atRisk}`, hint: "Under 50% this cycle" },
    { label: "Streaks", value: `${summary.streakCount}`, hint: "Subjects with a live streak" },
    {
      label: "Average",
      value: `${Math.round(summary.averageProgress)}%`,
      hint: summary.hitRate == null ? "Current cycle average" : `Hit rate ${summary.hitRate}%`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
