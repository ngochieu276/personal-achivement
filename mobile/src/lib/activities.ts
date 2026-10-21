import { formatDayHeading, localDayKey } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";

export function groupActivitiesByDay(items: ActivityItem[]) {
  const groups: { dayKey: string; label: string; items: ActivityItem[] }[] = [];
  const seen = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const dayKey = localDayKey(item.createdAt);
    let bucket = seen.get(dayKey);
    if (!bucket) {
      bucket = [];
      seen.set(dayKey, bucket);
      groups.push({ dayKey, label: formatDayHeading(dayKey), items: bucket });
    }
    bucket.push(item);
  }

  return groups;
}
