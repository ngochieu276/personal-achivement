import { View } from "react-native";
import { progressPercent } from "@/lib/subjects";
import { cn } from "@/lib/utils";

export function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, progressPercent(current, target));
  const done = current >= target && target > 0;
  return (
    <View className="h-2 overflow-hidden rounded-full bg-muted">
      <View
        className={cn("h-full rounded-full", done ? "bg-hit" : "bg-progress")}
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}
