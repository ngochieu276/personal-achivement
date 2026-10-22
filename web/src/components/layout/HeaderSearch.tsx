"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FolderKanban, Search, Target } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { EntityIcon } from "@/lib/icons";
import type { SearchResults } from "@/lib/types";
import { cn } from "@/lib/utils";

type Hit = {
  key: string;
  href: string;
  name: string;
  icon?: string | null;
  hint: string;
};

export function HeaderSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setQuery(input.trim()), 200);
    return () => window.clearTimeout(id);
  }, [input]);

  useEffect(() => {
    setOpen(false);
    setInput("");
    setQuery("");
    setActive(0);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const searchQuery = useQuery({
    queryKey: ["search", query],
    queryFn: () => api<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const projectHits: Hit[] = useMemo(
    () =>
      (searchQuery.data?.projects ?? []).map((project) => ({
        key: `project:${project.id}`,
        href: `/projects/${project.id}`,
        name: project.name,
        icon: project.icon,
        hint: t("search.projects"),
      })),
    [searchQuery.data?.projects, t],
  );

  const subjectHits: Hit[] = useMemo(
    () =>
      (searchQuery.data?.subjects ?? []).map((subject) => ({
        key: `subject:${subject.id}`,
        href: `/subjects/${subject.id}`,
        name: subject.name,
        icon: subject.icon,
        hint: `${t("search.subjects")} · ${subject.projectName}`,
      })),
    [searchQuery.data?.subjects, t],
  );

  const hits = useMemo(() => [...projectHits, ...subjectHits], [projectHits, subjectHits]);

  useEffect(() => {
    setActive(0);
  }, [query, hits.length]);

  function go(href: string) {
    setOpen(false);
    setInput("");
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || hits.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
    }
  }

  const showPanel = open && query.length > 0;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="relative mx-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          className="h-9 pl-8"
          role="combobox"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>
      {showPanel ? (
        <div className="absolute left-1/2 z-30 mt-1 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-md border bg-card shadow-md">
          {searchQuery.isFetching && !searchQuery.data ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("search.empty")}</p>
          ) : (
            <div className="max-h-80 overflow-auto p-1">
              {projectHits.length > 0 ? (
                <ResultGroup
                  title={t("search.projects")}
                  hits={projectHits}
                  offset={0}
                  active={active}
                  fallback={FolderKanban}
                  onHover={setActive}
                  onSelect={go}
                />
              ) : null}
              {subjectHits.length > 0 ? (
                <ResultGroup
                  title={t("search.subjects")}
                  hits={subjectHits}
                  offset={projectHits.length}
                  active={active}
                  fallback={Target}
                  onHover={setActive}
                  onSelect={go}
                />
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  hits,
  offset,
  active,
  fallback,
  onHover,
  onSelect,
}: {
  title: string;
  hits: Hit[];
  offset: number;
  active: number;
  fallback: typeof FolderKanban;
  onHover: (index: number) => void;
  onSelect: (href: string) => void;
}) {
  return (
    <div className="py-1">
      <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {hits.map((hit, index) => {
        const selected = offset + index === active;
        return (
          <button
            key={hit.key}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
              selected ? "bg-muted" : "hover:bg-muted/70",
            )}
            onMouseEnter={() => onHover(offset + index)}
            onClick={() => onSelect(hit.href)}
          >
            <EntityIcon name={hit.icon} fallback={fallback} className="h-4 w-4 shrink-0 text-secondary" />
            <span className="min-w-0">
              <span className="block truncate">{hit.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{hit.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
