import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { WebView } from "react-native-webview";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle, Label } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { localeTag, useI18n } from "@/i18n";
import { api, apiBlob } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type {
  PeriodWindow,
  Subject,
  SubjectDetail,
  SubjectEvent,
  SubjectEventsResponse,
  SubjectFile,
  SubjectHistory,
} from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { colors } from "@/lib/theme";

function useSubjectPatch(subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<SubjectDetail>(`/subjects/${subjectId}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
    },
  });
}

export function HistoryLine({
  item,
  unit,
}: {
  item: Pick<SubjectHistory, "type" | "payload">;
  unit: string;
}) {
  const { t } = useI18n();
  if (item.type === "kpi_done") {
    const kind = String(item.payload.kind ?? "add");
    const amount = Number(item.payload.amount ?? 0);
    const total = Number(item.payload.total ?? 0);
    return (
      <Text className="text-sm text-foreground">
        {kind === "set"
          ? t("subjects.setCurrent", { total, unit })
          : t("subjects.addedProgress", { amount, unit, total })}
      </Text>
    );
  }
  if (item.type === "kpi_change") {
    return (
      <Text className="text-sm text-foreground">
        {t("subjects.kpiUpdated", { old: String(item.payload.oldKpi), new: String(item.payload.newKpi), unit })}
      </Text>
    );
  }
  if (item.type === "subject_event") {
    const status = String(item.payload.status ?? "");
    return (
      <Text className="text-sm text-foreground">
        {status === "finish"
          ? t("subjects.periodFinished", {
              progress: Number(item.payload.progress ?? 0),
              kpi: Number(item.payload.kpi ?? 0),
              unit,
            })
          : t("subjects.periodMissed", {
              progress: Number(item.payload.progress ?? 0),
              kpi: Number(item.payload.kpi ?? 0),
              unit,
            })}
      </Text>
    );
  }
  if (item.type === "streak_hit") {
    return <Text className="text-sm text-foreground">{t("subjects.streakHit", { streak: String(item.payload.streak ?? 0) })}</Text>;
  }
  return <Text className="text-sm text-foreground">{t("subjects.loggedEvent")}</Text>;
}

export function SubjectNote({ subjectId, note }: { subjectId: string; note: string | null }) {
  const { t } = useI18n();
  const [value, setValue] = useState(note ?? "");
  const patch = useSubjectPatch(subjectId);
  return (
    <Card>
      <CardTitle>{t("subjects.note")}</CardTitle>
      <CardDescription>{t("subjects.noteDesc")}</CardDescription>
      <Input className="mt-3 h-24" multiline value={value} onChangeText={setValue} placeholder={t("subjects.notePlaceholder")} />
      <Button className="mt-3" loading={patch.isPending} onPress={() => patch.mutate({ note: value })}>
        {t("common.save")}
      </Button>
    </Card>
  );
}

export function SubjectDocuments({ subjectId, documents }: { subjectId: string; documents: string[] }) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const patch = useSubjectPatch(subjectId);
  return (
    <Card>
      <CardTitle>{t("subjects.youtube")}</CardTitle>
      <CardDescription>{t("subjects.youtubeDesc")}</CardDescription>
      {documents.length === 0 ? <Text className="mt-2 text-sm text-muted-foreground">{t("subjects.noVideos")}</Text> : null}
      {documents.map((item) => {
        const embed = youtubeEmbedUrl(item);
        return (
          <View key={item} className="mt-3 gap-2">
            {embed ? <WebView source={{ uri: embed }} style={{ height: 180 }} /> : null}
            <Pressable onPress={() => Linking.openURL(item)}>
              <Text className="text-sm text-secondary">{item}</Text>
            </Pressable>
            <Button
              variant="outline"
              size="sm"
              onPress={() => patch.mutate({ documents: documents.filter((doc) => doc !== item) })}
            >
              {t("common.removeNamed", { name: item })}
            </Button>
          </View>
        );
      })}
      <View className="mt-3 gap-2">
        <Label>{t("subjects.documentUrl")}</Label>
        <Input value={url} onChangeText={setUrl} autoCapitalize="none" />
        <Button
          onPress={() => {
            if (!url.trim()) return;
            patch.mutate({ documents: [...documents, url.trim()] });
            setUrl("");
          }}
        >
          {t("common.add")}
        </Button>
      </View>
    </Card>
  );
}

export function SubjectImages({ subjectId, images }: { subjectId: string; images: string[] }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: (url: string) =>
      api<SubjectDetail>(`/subjects/${subjectId}/images`, { method: "DELETE", body: JSON.stringify({ url }) }),
    onSuccess: (data) => queryClient.setQueryData(["subject", subjectId], data),
  });

  async function upload() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const form = new FormData();
    form.append("images", {
      uri: asset.uri,
      name: asset.fileName ?? "image.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as never);
    setPending(true);
    try {
      const data = await api<SubjectDetail>(`/subjects/${subjectId}/images`, { method: "POST", body: form });
      queryClient.setQueryData(["subject", subjectId], data);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardTitle>{t("subjects.images")}</CardTitle>
      <CardDescription>{t("subjects.imagesDesc")}</CardDescription>
      {images.length === 0 ? <Text className="mt-2 text-sm text-muted-foreground">{t("subjects.noImages")}</Text> : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {images.map((url, index) => (
          <Pressable key={url} onLongPress={() => setDeleting(url)}>
            <Image source={{ uri: url }} style={{ width: 96, height: 96, borderRadius: 8 }} />
            <Text className="mt-1 text-xs text-muted-foreground">{t("subjects.imageN", { n: index + 1 })}</Text>
          </Pressable>
        ))}
      </View>
      <Button className="mt-3" loading={pending} onPress={() => void upload()}>
        {pending ? t("subjects.uploading") : t("subjects.uploadImages")}
      </Button>
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t("subjects.deleteImage")}
        description={t("subjects.deleteImageDesc")}
        confirmLabel={t("subjects.deleteImageBtn")}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
          setDeleting(null);
        }}
      />
    </Card>
  );
}

export function SubjectFiles({ subjectId, files }: { subjectId: string; files: SubjectFile[] }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<SubjectFile | null>(null);

  async function upload() {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const form = new FormData();
    for (const file of result.assets) {
      form.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/octet-stream",
      } as never);
    }
    setPending(true);
    try {
      const data = await api<{ files: SubjectFile[] }>(`/subjects/${subjectId}/files`, { method: "POST", body: form });
      queryClient.setQueryData(["subject", subjectId], (current: SubjectDetail | undefined) =>
        current ? { ...current, files: data.files } : current,
      );
    } finally {
      setPending(false);
    }
  }

  async function download(file: SubjectFile) {
    const buffer = await apiBlob(`/subjects/${subjectId}/files/${file.id}`);
    const dest = new File(Paths.cache, file.name);
    dest.write(new Uint8Array(buffer));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(dest.uri);
  }

  const remove = useMutation({
    mutationFn: (fileId: string) => api(`/subjects/${subjectId}/files/${fileId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
    },
  });

  return (
    <Card>
      <CardTitle>{t("subjects.files")}</CardTitle>
      <CardDescription>{t("subjects.filesDesc")}</CardDescription>
      {files.length === 0 ? <Text className="mt-2 text-sm text-muted-foreground">{t("subjects.noFiles")}</Text> : null}
      {files.map((file) => (
        <View key={file.id} className="mt-3 flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-sm text-foreground">{file.name}</Text>
          <Button variant="outline" size="sm" onPress={() => void download(file)}>
            {t("common.downloadNamed", { name: file.name })}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setDeleting(file)}>
            {t("common.deleteNamed", { name: file.name })}
          </Button>
        </View>
      ))}
      <Button className="mt-3" loading={pending} onPress={() => void upload()}>
        {pending ? t("subjects.uploading") : t("subjects.uploadFiles")}
      </Button>
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={t("subjects.deleteFile")}
        description={t("subjects.deleteFileDesc", { name: deleting?.name ?? "" })}
        confirmLabel={t("subjects.deleteFileBtn")}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
      />
    </Card>
  );
}

export function SubjectRecords({
  subjectId,
  projectId,
  records,
  enabled,
}: {
  subjectId: string;
  projectId: string;
  records?: Subject["records"];
  enabled: boolean;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [number, setNumber] = useState("");
  const add = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/records`, {
        method: "POST",
        body: JSON.stringify({ date, recordNumber: Number(number) }),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      setNumber("");
    },
  });

  return (
    <Card>
      <CardTitle>{t("subjects.records")}</CardTitle>
      <CardDescription>{enabled ? t("subjects.recordsDesc") : t("subjects.recordsHint")}</CardDescription>
      {!enabled ? null : (
        <View className="mt-3 gap-2">
          {(records ?? []).length === 0 ? (
            <Text className="text-sm text-muted-foreground">{t("subjects.noRecords")}</Text>
          ) : (
            (records ?? []).slice(0, 8).map((record) => (
              <Text key={record.id} className="text-sm text-foreground">
                {formatDate(record.date)} · {record.recordNumber}
              </Text>
            ))
          )}
          <Label>{t("common.date")}</Label>
          <Input value={date} onChangeText={setDate} />
          <Label>{t("common.number")}</Label>
          <Input value={number} onChangeText={setNumber} keyboardType="decimal-pad" />
          <Button loading={add.isPending} disabled={!number} onPress={() => add.mutate()}>
            {t("common.addRecord")}
          </Button>
        </View>
      )}
    </Card>
  );
}

type PeriodChartRange = "fourWeeks" | "threeMonths" | "sixMonths";

export function SubjectPeriodChart({
  subject,
  activeWindow,
  unit,
}: {
  subject: Subject;
  activeWindow: PeriodWindow;
  unit: string;
}) {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<PeriodChartRange>("fourWeeks");
  const eventsQuery = useQuery({
    queryKey: ["subject-events", subject.id],
    queryFn: () => api<SubjectEventsResponse>(`/subjects/${subject.id}/events`),
  });

  const from =
    range === "fourWeeks"
      ? new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - (range === "threeMonths" ? 2 : 5), 1));

  const byStart = new Map<string, { label: string; target: number; actual: number }>();
  for (const event of eventsQuery.data?.events ?? []) {
    if (new Date(event.periodEnd) <= from) continue;
    byStart.set(event.periodStart, {
      label: new Intl.DateTimeFormat(localeTag(locale), { month: "short", day: "numeric" }).format(new Date(event.periodStart)),
      target: event.kpiSnapshot,
      actual: event.progress,
    });
  }
  if (new Date(activeWindow.end) > from && !byStart.has(activeWindow.start)) {
    byStart.set(activeWindow.start, {
      label: new Intl.DateTimeFormat(localeTag(locale), { month: "short", day: "numeric" }).format(new Date(activeWindow.start)),
      target: subject.kpi,
      actual: subject.currentProgress,
    });
  }
  const points = [...byStart.values()];
  const yMax = Math.max(1, ...points.map((point) => Math.max(point.actual, point.target))) * 1.5;

  return (
    <Card>
      <CardTitle>{t("subjects.chartTitle")}</CardTitle>
      <CardDescription>{t("subjects.chartDesc")}</CardDescription>
      <Select
        className="mt-3"
        value={range}
        onChange={setRange}
        options={[
          { value: "fourWeeks", label: t("subjects.chart4Weeks") },
          { value: "threeMonths", label: t("subjects.chart3Months") },
          { value: "sixMonths", label: t("subjects.chart6Months") },
        ]}
      />
      {eventsQuery.isError ? (
        <Text className="mt-3 text-sm text-destructive">{t("subjects.loadPeriodsError")}</Text>
      ) : points.length === 0 ? (
        <Text className="mt-3 text-sm text-muted-foreground">{t("subjects.chartEmpty")}</Text>
      ) : (
        <View className="mt-3">
          <LineChart
            data={points.map((point) => ({ value: point.actual, label: point.label }))}
            data2={points.map((point) => ({ value: point.target }))}
            height={180}
            maxValue={yMax}
            color={colors.progress}
            color2={colors.secondary}
            thickness={2}
            hideDataPoints={false}
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            noOfSections={4}
          />
          <Text className="mt-2 text-xs text-muted-foreground">
            {t("subjects.chartActual")} ({unit}) / {t("subjects.chartTarget")}
          </Text>
        </View>
      )}
    </Card>
  );
}

export function SubjectHistoryList({ history, unit }: { history: SubjectHistory[]; unit: string }) {
  const { t } = useI18n();
  return (
    <View className="gap-3">
      {history.length === 0 ? (
        <Text className="text-sm text-muted-foreground">{t("subjects.noHistory")}</Text>
      ) : (
        history.map((item) => (
          <View key={item.id} className="border-l-2 border-border pl-3">
            <Text className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</Text>
            <HistoryLine item={item} unit={unit} />
          </View>
        ))
      )}
    </View>
  );
}

export function PeriodTimeline({
  subjectId,
  events,
  unit,
}: {
  subjectId: string;
  events: SubjectEvent[];
  unit: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SubjectEvent | null>(null);
  const [kpi, setKpi] = useState("");
  const [progress, setProgress] = useState("");
  const save = useMutation({
    mutationFn: () =>
      api(`/subjects/${subjectId}/events/${editing?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ kpi: Number(kpi), progress: Number(progress) }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["subject-events", subjectId] });
      await queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  if (events.length === 0) {
    return <Text className="text-sm text-muted-foreground">{t("subjects.noClosedPeriods")}</Text>;
  }

  return (
    <View className="gap-3">
      {events.map((event) => (
        <View key={event.id} className="rounded-lg border border-border p-3">
          <Text className={event.status === "finish" ? "text-hit" : "text-miss"}>
            {event.status === "finish" ? t("landing.finished") : t("landing.missed")}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {formatDate(event.periodStart)} – {formatDate(event.periodEnd)}
          </Text>
          <Text className="text-sm text-foreground">
            {event.progress} / {event.kpiSnapshot} {unit}
          </Text>
          <Button
            className="mt-2"
            variant="outline"
            size="sm"
            onPress={() => {
              setEditing(event);
              setKpi(String(event.kpiSnapshot));
              setProgress(String(event.progress));
            }}
          >
            {t("common.save")}
          </Button>
        </View>
      ))}
      {editing ? (
        <View className="gap-2 rounded-lg border border-border p-3">
          <Label>{t("subjects.kpi")}</Label>
          <Input value={kpi} onChangeText={setKpi} keyboardType="decimal-pad" />
          <Label>{t("subjects.loggedUnit", { unit })}</Label>
          <Input value={progress} onChangeText={setProgress} keyboardType="decimal-pad" />
          <Button loading={save.isPending} onPress={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
