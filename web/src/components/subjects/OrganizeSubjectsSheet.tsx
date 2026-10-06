"use client";

import { GripVertical, ListOrdered } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { EntityIcon } from "@/lib/icons";
import { compareSubjects } from "@/lib/subjects";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrganizeSubjectsButton({
  projectId,
  subjects,
}: {
  projectId: string;
  subjects: Subject[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ListOrdered className="h-4 w-4" />
        {t("subjects.organize")}
      </Button>
      <OrganizeSubjectsSheet
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        subjects={subjects}
      />
    </>
  );
}

function OrganizeSubjectsSheet({
  open,
  onOpenChange,
  projectId,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subjects: Subject[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [items, setItems] = useState(() => [...subjects].sort(compareSubjects));
  const itemsRef = useRef(items);
  const dragIndex = useRef<number | null>(null);
  itemsRef.current = items;

  useEffect(() => {
    if (open) setItems([...subjects].sort(compareSubjects));
  }, [open, subjects]);

  const reorder = useMutation({
    mutationFn: (subjectIds: string[]) =>
      api(`/projects/${projectId}/subjects/order`, {
        method: "PATCH",
        body: JSON.stringify({ subjectIds }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
    },
  });

  function persist(list: Subject[]) {
    const subjectIds = list.map((subject) => subject.id);
    const unchanged = subjects.length === subjectIds.length
      && subjects.every((subject, index) => subject.id === subjectIds[index] && subject.orderIndex === index);
    if (unchanged) return;
    queryClient.setQueryData(["subjects", projectId], (current: { subjects: Subject[] } | undefined) => {
      if (!current) return current;
      const byId = new Map(current.subjects.map((subject) => [subject.id, subject]));
      return {
        subjects: subjectIds.flatMap((id, index) => {
          const subject = byId.get(id);
          return subject ? [{ ...subject, orderIndex: index }] : [];
        }),
      };
    });
    reorder.mutate(subjectIds);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md bg-card text-card-foreground">
        <SheetHeader className="pr-8">
          <SheetTitle>{t("subjects.organizeTitle")}</SheetTitle>
          <SheetDescription>{t("subjects.organizeDesc")}</SheetDescription>
        </SheetHeader>
        <ol className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {items.map((subject, index) => (
            <li
              key={subject.id}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => {
                event.preventDefault();
                const from = dragIndex.current;
                if (from == null || from === index) return;
                setItems((current) => moveItem(current, from, index));
                dragIndex.current = index;
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                persist(itemsRef.current);
              }}
              className={cn(
                "flex cursor-grab items-center gap-3 rounded-md border bg-background px-3 py-2.5 active:cursor-grabbing",
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <EntityIcon name={subject.icon} className="h-4 w-4 shrink-0 text-secondary" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{subject.name}</span>
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  );
}

function moveItem<T>(list: T[], from: number, to: number) {
  if (from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
