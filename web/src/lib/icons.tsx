import { FolderKanban } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import type { LucideIcon } from "lucide-react";

const ICON_NAME_SET = new Set<string>(iconNames);

export const ICON_NAMES = iconNames;

export const FEATURED_ICON_NAMES: IconName[] = [
  "folder-kanban",
  "dumbbell",
  "flame",
  "bike",
  "footprints",
  "activity",
  "heart",
  "timer",
  "clock",
  "repeat",
  "target",
  "trophy",
  "medal",
  "flag",
  "zap",
  "sparkles",
  "book-open",
  "music",
  "coffee",
  "leaf",
  "sun",
  "moon",
  "mountain",
  "waves",
];

export function toKebabCase(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function toPascalCase(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function toLucideIconName(name?: string | null): IconName | undefined {
  if (!name) return undefined;
  const kebab = name.includes("-") ? name.toLowerCase() : toKebabCase(name);
  return ICON_NAME_SET.has(kebab) ? (kebab as IconName) : undefined;
}

export function EntityIcon({
  name,
  fallback: Fallback = FolderKanban,
  className,
}: {
  name?: string | null;
  fallback?: LucideIcon;
  className?: string;
}) {
  const iconName = toLucideIconName(name);
  if (!iconName) return <Fallback className={className} />;
  return (
    <DynamicIcon
      name={iconName}
      className={className}
      fallback={() => <Fallback className={className} />}
    />
  );
}

export function normalizeIconQuery(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function iconMatchesQuery(name: string, query: string) {
  const needle = normalizeIconQuery(query);
  if (!needle) return false;
  return normalizeIconQuery(name).includes(needle);
}
