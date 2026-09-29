import { ActivityRow } from "@/components/activities/ActivityRow";
import type { ActivityItem } from "@/lib/types";

export function ActivityDayGroup({
  label,
  items,
}: {
  label: string;
  items: ActivityItem[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl">{label}</h2>
      <ol className="space-y-4">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}
