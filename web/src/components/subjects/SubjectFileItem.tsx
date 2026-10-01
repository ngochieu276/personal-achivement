"use client";

import { Download, Eye, FileSpreadsheet, FileText, Image, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { apiBlob } from "@/lib/api";
import { fileKind, formatDate } from "@/lib/format";
import type { SubjectFile } from "@/lib/types";

const icons = {
  image: Image,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  file: FileText,
};

export function SubjectFileItem({
  subjectId,
  file,
  pending,
  onPreview,
  onDelete,
}: {
  subjectId: string;
  file: SubjectFile;
  pending: boolean;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const Icon = icons[fileKind(file.mimeType)];

  async function download() {
    const blob = await apiBlob(`/subjects/${subjectId}/files/${file.id}`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li className="flex items-center gap-3 rounded-md border p-3">
      <Icon className="h-4 w-4 shrink-0 text-secondary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview} aria-label={t("common.previewNamed", { name: file.name })}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => void download()} aria-label={t("common.downloadNamed", { name: file.name })}>
          <Download className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDelete}
          disabled={pending}
          aria-label={t("common.deleteNamed", { name: file.name })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
