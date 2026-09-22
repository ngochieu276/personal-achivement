import { LayoutGrid, List } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useViewStore, type ViewMode } from "@/stores/view";

export function ViewToggle() {
  const mode = useViewStore((state) => state.mode);
  const setMode = useViewStore((state) => state.setMode);

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      <ModeButton
        active={mode === "cards"}
        label="Card view"
        onClick={() => setMode("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
      </ModeButton>
      <ModeButton
        active={mode === "list"}
        label="List view"
        onClick={() => setMode("list")}
      >
        <List className="h-4 w-4" />
      </ModeButton>
    </div>
  );
}

function ModeButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      className={cn("h-8 w-8", active && "bg-muted")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function viewClass(mode: ViewMode, _kind: "projects" | "subjects") {
  if (mode === "list") return "grid gap-2";
  return "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
}
