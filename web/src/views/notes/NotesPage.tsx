"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CardListSkeleton } from "@/components/layout/CardListSkeleton";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteDialog } from "@/components/notes/NoteDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { Note, SubjectOption } from "@/lib/types";

export function NotesPage() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => api<{ notes: Note[] }>("/notes"),
  });

  const subjectsQuery = useQuery({
    queryKey: ["subject-options"],
    queryFn: () => api<{ subjects: SubjectOption[] }>("/subjects/options"),
  });

  const notes = notesQuery.data?.notes ?? [];
  const subjects = subjectsQuery.data?.subjects ?? [];
  const dialogOpen = open || Boolean(editing);

  function closeDialog(next: boolean) {
    if (next) return;
    setOpen(false);
    setEditing(null);
  }

  return (
    <Page>
      <PageHeader
        eyebrow={t("notes.eyebrow")}
        title={t("notes.title")}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("notes.add")}
          </Button>
        }
      />

      <NoteDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        note={editing}
        subjects={subjects}
      />

      {notesQuery.isLoading ? (
        <PageLoading label={t("notes.loading")}>
          <CardListSkeleton kind="subjects" />
        </PageLoading>
      ) : notes.length === 0 ? (
        <ListPlaceholder
          variant="empty"
          title={t("notes.emptyTitle")}
          description={t("notes.emptyDesc")}
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t("notes.add")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onEdit={setEditing} />
          ))}
        </div>
      )}
    </Page>
  );
}
