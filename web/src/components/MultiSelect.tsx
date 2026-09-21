import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  emptyLabel = "Nothing to select",
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selected = options.filter((option) => value.includes(option.value));
  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? selected[0].label
      : `${selected.length} selected`;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        disabled={options.length === 0}
        onClick={() => setOpen((next) => !next)}
        aria-expanded={open}
      >
        <span className="truncate">{options.length === 0 ? emptyLabel : label}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-card p-1 shadow-md">
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => toggle(option.value)}
              >
                <Check className={cn("h-4 w-4", checked ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
