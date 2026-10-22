"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
  searchable = false,
  searchPlaceholder,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const resolvedPlaceholder = placeholder ?? t("common.select");
  const resolvedEmptyLabel = emptyLabel ?? t("common.nothingToSelect");

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (searchable) searchRef.current?.focus();
  }, [open, searchable]);

  const selected = options.filter((option) => value.includes(option.value));
  const label = selected.length === 0
    ? resolvedPlaceholder
    : selected.length === 1
      ? selected[0].label
      : t("common.selectedCount", { count: selected.length });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

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
        <span className="truncate">{options.length === 0 ? resolvedEmptyLabel : label}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-hidden rounded-md border bg-card shadow-md">
          {searchable ? (
            <div className="border-b p-1">
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder ?? t("common.search")}
                className="h-8"
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                  if (event.key === "Escape") setOpen(false);
                }}
              />
            </div>
          ) : null}
          <div className="max-h-48 overflow-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">{t("common.noMatches")}</p>
            ) : (
              filtered.map((option) => {
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
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
