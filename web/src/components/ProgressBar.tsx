import { cn } from "@/lib/utils";

export function ProgressBar({
  current,
  target,
  size = "md",
}: {
  current: number;
  target: number;
  size?: "inline" | "md" | "lg";
}) {
  const ratio = target <= 0 ? 0 : Math.min(1, current / target);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-muted",
        size === "lg" ? "h-3" : "h-2",
        size === "inline" && "hidden w-24 sm:block",
      )}
    >
      <div
        className={cn("h-full rounded-full", ratio >= 1 ? "bg-hit" : "bg-primary")}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
