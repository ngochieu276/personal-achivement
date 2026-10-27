"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { EditButton } from "@/components/shared/EditButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import type { Note } from "@/lib/types";

export function NoteCard({ note, onEdit }: { note: Note; onEdit: (note: Note) => void }) {
  const { t } = useI18n();
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useLayoutEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [expanded, note.body]);

  return (
    <Card className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => onEdit(note)}>
      <CardHeader className="flex-row items-start gap-4 p-4">
        <div className="min-w-0 flex-1">
          <CardTitle>{note.title}</CardTitle>
          <CardDescription>{formatDate(note.updatedAt)}</CardDescription>
        </div>
        <EditButton label={t("common.editNamed", { name: note.title })} onClick={() => onEdit(note)} />
      </CardHeader>
      {note.body ? (
        <CardContent className="pt-0">
          <p
            ref={bodyRef}
            className={`whitespace-pre-wrap text-sm text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}
          >
            {note.body}
          </p>
          {canExpand ? (
            <button
              type="button"
              className="mt-1 text-sm font-medium text-secondary hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((current) => !current);
              }}
            >
              {expanded ? t("notes.seeLess") : t("notes.seeMore")}
            </button>
          ) : null}
        </CardContent>
      ) : null}
      <CardContent className="flex flex-wrap gap-1.5 pt-0">
        {note.subjects.length === 0 ? (
          <span className="text-xs text-muted-foreground">{t("notes.noSubjects")}</span>
        ) : (
          note.subjects.map((subject) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`} onClick={(event) => event.stopPropagation()}>
              <Badge variant="outline">{subject.name}</Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
