"use client";

import { useState, type ReactNode } from "react";
import { FormDialog } from "@/components/shared/FormDialog";
import { SubjectForm, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { SubjectStatusDialog } from "@/components/subjects/SubjectStatusDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import type { SubjectStatus } from "@/lib/types";

export function SubjectFormDialog({
  open,
  onOpenChange,
  title,
  formKey,
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  trigger,
  status,
  statusComment,
  statusPending,
  statusError,
  onUpdateStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formKey?: string;
  initial?: Partial<SubjectFormValues>;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onSubmit: (values: SubjectFormValues) => void;
  trigger?: ReactNode;
  status?: SubjectStatus | null;
  statusComment?: string | null;
  statusPending?: boolean;
  statusError?: string;
  onUpdateStatus?: (status: SubjectStatus, comment: string | null) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        trigger={trigger}
        variant="scroll"
      >
        {onUpdateStatus ? (
          <div className="mb-4">
            <Button type="button" variant="outline" onClick={() => setStatusOpen(true)}>
              {t("subjects.updateStatus")}
            </Button>
          </div>
        ) : null}
        <SubjectForm
          key={formKey}
          initial={initial}
          submitLabel={submitLabel}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
        />
      </FormDialog>
      {onUpdateStatus ? (
        <SubjectStatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          status={status}
          comment={statusComment}
          pending={Boolean(statusPending)}
          error={statusError}
          onSubmit={async (nextStatus, comment) => {
            await onUpdateStatus(nextStatus, comment);
            setStatusOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
