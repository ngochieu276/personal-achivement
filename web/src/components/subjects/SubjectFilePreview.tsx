"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { apiBlob } from "@/lib/api";
import { fileKind } from "@/lib/format";
import type { SubjectFile } from "@/lib/types";

export function SubjectFilePreview({
  subjectId,
  file,
  open,
  onOpenChange,
}: {
  subjectId: string;
  file: SubjectFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const previewQuery = useQuery({
    queryKey: ["subject-file", subjectId, file?.id],
    queryFn: () => apiBlob(`/subjects/${subjectId}/files/${file!.id}`),
    enabled: open && Boolean(file),
    staleTime: 60_000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewQuery.data) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewQuery.data);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewQuery.data]);

  const kind = file ? fileKind(file.mimeType) : "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-0 left-0 top-0 flex h-svh max-h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-none border-0 p-4 sm:rounded-none">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{file?.name}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          {previewQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("subjects.loadingPreview")}</p>
          ) : previewQuery.isError ? (
            <p className="text-sm text-destructive">{previewQuery.error.message}</p>
          ) : objectUrl && kind === "image" ? (
            <img src={objectUrl} alt={file?.name} className="h-full w-full object-contain" />
          ) : objectUrl && kind === "pdf" ? (
            <iframe title={file?.name} src={objectUrl} className="h-full w-full border-0" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("subjects.officePreview")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
