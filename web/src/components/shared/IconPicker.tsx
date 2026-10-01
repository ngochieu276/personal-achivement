"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { IconName } from "lucide-react/dynamic";
import {
  EntityIcon,
  FEATURED_ICON_NAMES,
  ICON_NAMES,
  iconMatchesQuery,
  toLucideIconName,
  toPascalCase,
} from "@/lib/icons";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SEARCH_LIMIT = 80;

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  const selectedName = toLucideIconName(value);

  const { names, total } = useMemo(() => {
    if (!searching) {
      const featured: IconName[] = [...FEATURED_ICON_NAMES];
      if (selectedName && !featured.includes(selectedName)) {
        featured.push(selectedName);
      }
      return { names: featured, total: featured.length };
    }
    const matches = ICON_NAMES.filter((name) => iconMatchesQuery(name, trimmed));
    return { names: matches.slice(0, SEARCH_LIMIT), total: matches.length };
  }, [searching, selectedName, trimmed]);

  function selectIcon(name: IconName | "") {
    onChange(name ? toPascalCase(name) : "");
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Label>{t("common.iconOptional")}</Label>
      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            <span className="flex items-center gap-2 truncate">
              {value ? <EntityIcon name={value} className="h-4 w-4" /> : <span>—</span>}
              <span className="truncate">{value || t("common.noIcon")}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-3">
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder={t("common.searchIcons")}
              autoComplete="off"
              aria-label={t("common.searchIconsAria")}
            />
            <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto">
              <IconChoice selected={!value} onClick={() => selectIcon("")} ariaLabel={t("common.noIcon")}>
                —
              </IconChoice>
              {names.map((name) => (
                <IconChoice
                  key={name}
                  selected={selectedName === name}
                  onClick={() => selectIcon(name)}
                  ariaLabel={name}
                >
                  <EntityIcon name={name} className="h-4 w-4" />
                </IconChoice>
              ))}
            </div>
            <IconPickerHint searching={searching} shown={names.length} total={total} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function IconChoice({
  selected,
  onClick,
  ariaLabel,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border text-xs text-muted-foreground hover:bg-muted",
        selected && "border-primary bg-muted text-foreground",
      )}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      title={ariaLabel}
    >
      {children}
    </button>
  );
}

function IconPickerHint({
  searching,
  shown,
  total,
}: {
  searching: boolean;
  shown: number;
  total: number;
}) {
  const { t } = useI18n();

  if (!searching) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("common.featuredIcons", { count: ICON_NAMES.length })}
      </p>
    );
  }
  if (total === 0) {
    return <p className="text-xs text-muted-foreground">{t("common.noIcons")}</p>;
  }
  if (shown < total) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("common.showingIcons", { shown, total })}
      </p>
    );
  }
  return <p className="text-xs text-muted-foreground">{t("common.matchingIcons", { count: total })}</p>;
}
