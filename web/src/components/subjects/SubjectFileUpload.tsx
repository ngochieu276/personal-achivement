"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { SubjectDetail, SubjectFile } from "@/lib/types";

const ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/gif,image/webp,application/pdf";

export function SubjectFileUpload({
  subjectId,
}: {
  subjectId: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (files: FileList) => {
      const body = new FormData();
      for (const file of files) body.append("files", file);
      return api<{ files: SubjectFile[] }>(`/subjects/${subjectId}/files`, {
        method: "POST",
        body,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subject", subjectId], (current: SubjectDetail | undefined) => {
        if (!current) return current;
        return { ...current, files: [...data.files, ...(current.files ?? [])] };
      });
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept={ACCEPT}
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) upload.mutate(files);
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {upload.isPending ? t("subjects.uploading") : t("subjects.uploadFiles")}
      </Button>
      {upload.error ? <p className="text-sm text-destructive">{upload.error.message}</p> : null}
    </div>
  );
}
