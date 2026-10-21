import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Card";
import { AppModal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n";
import type { SubjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SubjectStatusBadge({
  status,
  comment,
}: {
  status?: SubjectStatus;
  comment?: string | null;
}) {
  const { t } = useI18n();
  if (!status || status === "active") return null;
  return (
    <View className={cn("self-start rounded-full px-2 py-0.5", status === "pending" ? "bg-streak/20" : "bg-miss/20")}>
      <Text className={status === "pending" ? "text-xs text-streak" : "text-xs text-miss"}>
        {status === "pending" ? t("subjects.statusPending") : t("subjects.statusEnding")}
        {comment ? ` · ${comment}` : ""}
      </Text>
    </View>
  );
}

export function SubjectStatusDialog({
  open,
  onClose,
  status,
  statusComment,
  pending,
  error,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  status?: SubjectStatus;
  statusComment?: string | null;
  pending?: boolean;
  error?: string;
  onSave: (status: SubjectStatus, statusComment: string | null) => void;
}) {
  const { t } = useI18n();
  const [next, setNext] = useState<SubjectStatus>(status ?? "active");
  const [reason, setReason] = useState(statusComment ?? "");

  return (
    <AppModal open={open} onClose={onClose} title={t("subjects.statusTitle")}>
      <View className="gap-4">
        <Select
          value={next}
          onChange={setNext}
          options={[
            { value: "active", label: t("subjects.statusActive") },
            { value: "pending", label: t("subjects.statusPending") },
            { value: "ending", label: t("subjects.statusEnding") },
          ]}
        />
        {next !== "active" ? (
          <View>
            <Label>{t("subjects.statusReason")}</Label>
            <Input value={reason} onChangeText={setReason} placeholder={t("subjects.statusReasonHint")} />
          </View>
        ) : null}
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        <Button
          loading={pending}
          onPress={() => {
            if (next !== "active" && !reason.trim()) return;
            onSave(next, next === "active" ? null : reason.trim());
          }}
        >
          {t("common.save")}
        </Button>
      </View>
    </AppModal>
  );
}
