import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-label={label}
      onClick={onClick}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}
