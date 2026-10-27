import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { EmptyState, PageHeader, Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle, Label } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AppModal, ConfirmDialog } from "@/components/ui/Modal";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Note, SubjectOption } from "@/lib/types";

export function NotesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  useEffect(() => {
    if (!dialogOpen) return;
    setTitle(editing?.title ?? "");
    setBody(editing?.body ?? "");
    setSubjectIds(editing?.subjectIds ?? []);
  }, [dialogOpen, editing]);

  function closeDialog() {
    setOpen(false);
    setEditing(null);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { title, body, subjectIds };
      if (editing) {
        return api<{ note: Note }>(`/notes/${editing.id}`, {
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
      closeDialog();
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/notes/${editing!.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      setConfirmDelete(false);
      closeDialog();
    },
  });

  return (
    <Screen>
      <PageHeader
        eyebrow={t("notes.eyebrow")}
        title={t("notes.title")}
        actions={
          <>
            <Button
              size="sm"
              onPress={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("notes.add")}
            </Button>
            <AccountMenu />
          </>
        }
      />
      <View className="flex-row flex-wrap gap-2">
        <Button variant="outline" onPress={() => router.replace("/projects")}>
          {t("nav.projects")}
        </Button>
      </View>

      {notesQuery.isLoading ? <Text className="text-muted-foreground">{t("notes.loading")}</Text> : null}
      {notes.length === 0 && !notesQuery.isLoading ? (
        <EmptyState title={t("notes.emptyTitle")} description={t("notes.emptyDesc")} />
      ) : (
        notes.map((note) => (
          <Pressable
            key={note.id}
            onPress={() => {
              setOpen(false);
              setEditing(note);
            }}
          >
            <Card>
              <CardTitle>{note.title}</CardTitle>
              <CardDescription>{formatDate(note.updatedAt)}</CardDescription>
              {note.body ? (
                <Text className="mt-2 text-sm text-muted-foreground" numberOfLines={3}>
                  {note.body}
                </Text>
              ) : null}
              <Text className="mt-2 text-xs text-muted-foreground">
                {note.subjects.length === 0
                  ? t("notes.noSubjects")
                  : note.subjects.map((subject) => subject.name).join(" · ")}
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      <AppModal
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? t("notes.edit") : t("notes.create")}
      >
        <View className="gap-3">
          <View>
            <Label>{t("notes.titleLabel")}</Label>
            <Input value={title} onChangeText={setTitle} />
          </View>
          <View>
            <Label>{t("notes.body")}</Label>
            <Input
              value={body}
              onChangeText={setBody}
              placeholder={t("notes.bodyPlaceholder")}
              multiline
              className="h-32 py-2"
            />
          </View>
          <View>
            <Label>{t("notes.subjects")}</Label>
            <MultiSelect
              options={subjects.map((subject) => ({
                value: subject.id,
                label: `${subject.name} · ${subject.projectName}`,
              }))}
              value={subjectIds}
              onChange={setSubjectIds}
              placeholder={t("notes.selectSubjects")}
              searchPlaceholder={t("notes.searchSubjects")}
            />
          </View>
          {save.error ? <Text className="text-sm text-destructive">{save.error.message}</Text> : null}
          <View className="flex-row flex-wrap gap-2">
            {editing ? (
              <Button variant="destructive" onPress={() => setConfirmDelete(true)}>
                {t("notes.deleteBtn")}
              </Button>
            ) : null}
            <Button onPress={() => save.mutate()} loading={save.isPending} disabled={!title.trim()}>
              {t("common.save")}
            </Button>
          </View>
        </View>
      </AppModal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("notes.delete")}
        description={t("notes.deleteDesc", { name: editing?.title ?? "" })}
        confirmLabel={remove.isPending ? t("common.deleting") : t("notes.deleteBtn")}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => remove.mutate()}
      />
    </Screen>
  );
}
