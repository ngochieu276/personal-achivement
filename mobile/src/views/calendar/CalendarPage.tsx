import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarMonth, CalendarTimeGrid } from "@/components/calendar/CalendarViews";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { PageHeader, Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Card";
import { AppModal, ConfirmDialog } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { localeTag, useI18n } from "@/i18n";
import { api } from "@/lib/api";
import {
  daysInRange,
  expandAll,
  recurrenceFromStart,
  startOfDay,
  stepCursor,
  titleForView,
  visibleRange,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { projectTone } from "@/lib/theme";
import type { CalendarRecurrence, CalendarTask, CalendarView, Project } from "@/lib/types";

type Draft = { task?: CalendarTask | null; startsAt: Date; endsAt: Date };
type Frequency = "none" | CalendarRecurrence["frequency"];

export function CalendarPage() {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [moreDay, setMoreDay] = useState<{ day: Date; items: CalendarOccurrence[] } | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [picking, setPicking] = useState<"start" | "end" | null>(null);

  const range = useMemo(() => visibleRange(view, cursor), [cursor, view]);
  const days = useMemo(() => daysInRange(range.from, range.to), [range.from, range.to]);
  const tasksQuery = useQuery({
    queryKey: ["calendar-tasks", range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      api<{ calendarTasks: CalendarTask[] }>(
        `/calendar-tasks?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`,
      ),
  });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });
  const occurrences = useMemo(
    () => expandAll(tasksQuery.data?.calendarTasks ?? [], range.from, range.to),
    [range.from, range.to, tasksQuery.data?.calendarTasks],
  );
  const projects = projectsQuery.data?.projects ?? [];

  function openCreate(startsAt: Date, endsAt: Date) {
    setTitle("");
    setProjectId(projects[0]?.id ?? "");
    setFrequency("none");
    setDraft({ startsAt, endsAt });
  }
  function openEdit(item: CalendarOccurrence) {
    setTitle(item.task.title);
    setProjectId(item.task.projectId);
    setFrequency(item.task.recurrence?.frequency ?? "none");
    setDraft({ task: item.task, startsAt: new Date(item.task.startsAt), endsAt: new Date(item.task.endsAt) });
  }
  function createOnDay(day: Date) {
    const start = startOfDay(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    openCreate(start, end);
  }

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("missing draft");
      const body = {
        title,
        projectId,
        startsAt: draft.startsAt.toISOString(),
        endsAt: draft.endsAt.toISOString(),
        recurrence: recurrenceFromStart(frequency, draft.startsAt),
      };
      if (draft.task) {
        return api(`/calendar-tasks/${draft.task.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return api("/calendar-tasks", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      setDraft(null);
    },
  });
  const remove = useMutation({
    mutationFn: () => api(`/calendar-tasks/${draft?.task?.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      setConfirmDelete(false);
      setDraft(null);
    },
  });

  return (
    <Screen scroll={view === "month"}>
      <PageHeader
        title={titleForView(view, cursor, tag)}
        actions={<AccountMenu />}
      />
      <View className="flex-row flex-wrap gap-2">
        <Button variant="outline" size="sm" onPress={() => setCursor(new Date())}>
          {t("calendar.today")}
        </Button>
        <Button variant="ghost" size="sm" onPress={() => setCursor((current) => stepCursor(view, current, -1))}>
          {t("calendar.previous")}
        </Button>
        <Button variant="ghost" size="sm" onPress={() => setCursor((current) => stepCursor(view, current, 1))}>
          {t("calendar.next")}
        </Button>
      </View>
      <Select
        value={view}
        onChange={setView}
        options={[
          { value: "day", label: t("calendar.viewDay") },
          { value: "fourDays", label: t("calendar.viewFourDays") },
          { value: "week", label: t("calendar.viewWeek") },
          { value: "month", label: t("calendar.viewMonth") },
        ]}
      />
      {tasksQuery.isLoading ? <Text className="text-muted-foreground">{t("calendar.loading")}</Text> : null}
      {view === "month" ? (
        <CalendarMonth
          cursor={cursor}
          occurrences={occurrences}
          onDayClick={(day) => {
            setCursor(day);
            setView("day");
          }}
          onSlotClick={createOnDay}
          onEventClick={openEdit}
          onMoreClick={(day, items) => setMoreDay({ day, items })}
        />
      ) : (
        <CalendarTimeGrid
          days={days}
          occurrences={occurrences}
          onSlotClick={(day, hour) => {
            const start = startOfDay(day);
            start.setHours(hour, 0, 0, 0);
            openCreate(start, new Date(start.getTime() + 60 * 60 * 1000));
          }}
          onEventClick={openEdit}
        />
      )}

      <AppModal
        open={Boolean(moreDay)}
        onClose={() => setMoreDay(null)}
        title={t("calendar.dayTasks", {
          date: moreDay?.day.toLocaleDateString(tag, { weekday: "long", month: "long", day: "numeric" }) ?? "",
        })}
      >
        {(moreDay?.items.length ?? 0) === 0 ? (
          <Text className="text-sm text-muted-foreground">{t("calendar.emptyDay")}</Text>
        ) : (
          moreDay?.items.map((item) => {
            const tone = projectTone(item.task.projectId);
            return (
              <Button
                key={`${item.task.id}-${item.startsAt.toISOString()}`}
                variant="outline"
                className="mb-2"
                onPress={() => {
                  setMoreDay(null);
                  setTimeout(() => openEdit(item), 0);
                }}
              >
                <Text style={{ color: tone.border }}>
                  {item.startsAt.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })} {item.task.title}
                </Text>
              </Button>
            );
          })
        )}
      </AppModal>

      <AppModal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.task ? t("calendar.editTask") : t("calendar.newTask")}
      >
        {projects.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t("calendar.emptyProject")}</Text>
        ) : draft ? (
          <View className="gap-3">
            <View>
              <Label>{t("calendar.taskTitle")}</Label>
              <Input value={title} onChangeText={setTitle} />
            </View>
            <View>
              <Label>{t("subjects.project")}</Label>
              <Select
                value={projectId}
                onChange={setProjectId}
                options={projects.map((project) => ({ value: project.id, label: project.name }))}
              />
            </View>
            <Button variant="outline" onPress={() => setPicking("start")}>
              {t("calendar.start")}: {draft.startsAt.toLocaleString(tag)}
            </Button>
            <Button variant="outline" onPress={() => setPicking("end")}>
              {t("calendar.end")}: {draft.endsAt.toLocaleString(tag)}
            </Button>
            {picking ? (
              <DateTimePicker
                value={picking === "start" ? draft.startsAt : draft.endsAt}
                mode="datetime"
                onChange={(_, date) => {
                  if (date) {
                    setDraft({ ...draft, [picking === "start" ? "startsAt" : "endsAt"]: date });
                  }
                  setPicking(null);
                }}
              />
            ) : null}
            <Select
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: "none", label: t("calendar.recurrenceNone") },
                { value: "daily", label: t("calendar.recurrenceDaily") },
                { value: "weekly", label: t("calendar.recurrenceWeekly") },
                { value: "monthly", label: t("calendar.recurrenceMonthly") },
              ]}
            />
            {save.error ? <Text className="text-sm text-destructive">{save.error.message}</Text> : null}
            <View className="flex-row flex-wrap gap-2">
              {draft.task ? (
                <>
                  <Button variant="destructive" onPress={() => setConfirmDelete(true)}>
                    {t("calendar.deleteTaskBtn")}
                  </Button>
                  <Button variant="outline" onPress={() => router.push(`/projects/${projectId}`)}>
                    {t("calendar.openProject")}
                  </Button>
                </>
              ) : null}
              <Button loading={save.isPending} disabled={!title.trim() || !projectId} onPress={() => save.mutate()}>
                {t("common.save")}
              </Button>
            </View>
          </View>
        ) : null}
      </AppModal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("calendar.deleteTask")}
        description={t("calendar.deleteTaskDesc")}
        confirmLabel={t("calendar.deleteTaskBtn")}
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </Screen>
  );
}
