import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExceedFlame({
  exceed,
  suffix = "",
  className,
}: {
  exceed: number;
  suffix?: string;
  className?: string;
}) {
  if (exceed <= 0) return null;
  const shown = Number.isInteger(exceed) ? String(exceed) : exceed.toFixed(1);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-emerald-600", className)}
      title={`Exceeded by ${shown}${suffix}`}
    >
      <Flame className="h-4 w-4 fill-emerald-500 text-emerald-500" />
      <span className="text-xs font-medium">+{shown}{suffix}</span>
    </span>
  );
}
