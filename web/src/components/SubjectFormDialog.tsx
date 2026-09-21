import type { ReactNode } from "react";
import { FormDialog } from "@/components/FormDialog";
import { SubjectForm, type SubjectFormValues } from "@/components/SubjectForm";

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
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      trigger={trigger}
      variant="scroll"
    >
      <SubjectForm
        key={formKey}
        initial={initial}
        submitLabel={submitLabel}
        pending={pending}
        error={error}
        onSubmit={onSubmit}
      />
    </FormDialog>
  );
}
