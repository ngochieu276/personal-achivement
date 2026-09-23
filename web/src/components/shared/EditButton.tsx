import { Pencil } from "lucide-react";
import type { MouseEvent } from "react";
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
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn("relative z-10 h-8 w-8 shrink-0", className)}
      aria-label={label}
      onClick={handleClick}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}
