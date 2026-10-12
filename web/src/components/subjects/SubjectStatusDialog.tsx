"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import type { SubjectStatus } from "@/lib/types";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SubjectStatusDialog({
  open,
  onOpenChange,
  status,
  comment,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: SubjectStatus | null;
  comment?: string | null;
  pending: boolean;
  error?: string;
  onSubmit: (status: SubjectStatus, comment: string | null) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [nextStatus, setNextStatus] = useState<SubjectStatus>(status ?? "active");
  const [reason, setReason] = useState(comment ?? "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNextStatus(status ?? "active");
    setReason(comment ?? "");
    setLocalError("");
  }, [comment, open, status]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (nextStatus !== "active" && !trimmed) {
      setLocalError(t("subjects.statusReasonRequired"));
      return;
    }
    try {
      await onSubmit(nextStatus, nextStatus === "active" ? null : trimmed);
    } catch {
      // Parent surfaces the API error on this dialog.
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={t("subjects.statusTitle")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="subject-status">{t("subjects.statusTitle")}</Label>
          <select
            id="subject-status"
            className={selectClass}
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as SubjectStatus)}
          >
            <option value="active">{t("subjects.statusActive")}</option>
            <option value="pending">{t("subjects.statusPending")}</option>
            <option value="ending">{t("subjects.statusEnding")}</option>
          </select>
        </div>
        {nextStatus !== "active" ? (
          <div className="space-y-2">
            <Label htmlFor="subject-status-reason">{t("subjects.statusReason")}</Label>
            <Textarea
              id="subject-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("subjects.statusReasonHint")}
              rows={4}
              className="min-h-24"
            />
          </div>
        ) : null}
        {localError || error ? <p className="text-sm text-destructive">{localError || error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
}
