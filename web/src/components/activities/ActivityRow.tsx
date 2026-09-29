import { Link } from "react-router-dom";
import { HistoryLine } from "@/components/subjects/SubjectHistory";
import { EntityIcon } from "@/lib/icons";
import { formatTime, unitLabel } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";

export function ActivityRow({ item }: { item: ActivityItem }) {
  const unit = unitLabel(item.subject.kpiType);

  return (
    <li className="flex gap-3">
      <p className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
      <div className="min-w-0 flex-1 border-l-2 border-border pl-3">
        <Link
          to={`/subjects/${item.subject.id}`}
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <EntityIcon name={item.subject.icon} className="h-4 w-4 shrink-0 text-secondary" />
          <span className="truncate">{item.subject.name}</span>
          <span className="truncate font-normal text-muted-foreground">· {item.subject.projectName}</span>
        </Link>
        <div className="text-sm text-foreground">
          <HistoryLine item={item} unit={unit} />
        </div>
      </div>
    </li>
  );
}
