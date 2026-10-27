"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { Note, SubjectOption } from "@/lib/types";

export function NoteDialog({
  open,
  onOpenChange,
  note,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
  subjects: SubjectOption[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setSubjectIds(note?.subjectIds ?? []);
    setConfirmDelete(false);
  }, [note, open]);

  const save = useMutation({
    mutationFn: () => {
      const payload = { title, body, subjectIds };
      if (note) {
        return api<{ note: Note }>(`/notes/${note.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api<{ note: Note }>("/notes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      onOpenChange(false);
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/notes/${note!.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setConfirmDelete(false);
      onOpenChange(false);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={note ? t("notes.edit") : t("notes.create")}
        variant="scroll"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="note-title">{t("notes.titleLabel")}</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-body">{t("notes.body")}</Label>
            <Textarea
              id="note-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t("notes.bodyPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("notes.subjects")}</Label>
            <MultiSelect
              searchable
              options={subjects.map((subject) => ({
                value: subject.id,
                label: `${subject.name} · ${subject.projectName}`,
              }))}
              value={subjectIds}
              onChange={setSubjectIds}
              placeholder={t("notes.selectSubjects")}
              searchPlaceholder={t("notes.searchSubjects")}
            />
          </div>
          {save.error ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
          <div className="flex items-center justify-between gap-2">
            {note ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                {t("notes.deleteBtn")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending || !title.trim()}>
                {save.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        </form>
      </FormDialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("notes.delete")}
        description={t("notes.deleteDesc", { name: note?.title ?? "" })}
        confirmLabel={remove.isPending ? t("common.deleting") : t("notes.deleteBtn")}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
