"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { SubjectDetail } from "@/lib/types";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function screenshotFile(file: File, type: string) {
  const mime = IMAGE_TYPES.has(type) ? type : IMAGE_TYPES.has(file.type) ? file.type : "image/png";
  if (file.name && file.name !== "image.png") return file;
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1] || "png";
  return new File([file], `screenshot-${Date.now()}.${ext}`, { type: mime });
}

function imagesFromClipboard(data: DataTransfer | null) {
  if (!data) return [];
  const files: File[] = [];
  for (const item of data.items) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) files.push(screenshotFile(file, item.type));
  }
  if (files.length > 0) return files;
  for (const file of data.files) {
    if (file.type.startsWith("image/")) files.push(screenshotFile(file, file.type));
  }
  return files;
}

export function SubjectImages({
  subjectId,
  images,
}: {
  subjectId: string;
  images: string[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (files: File[] | FileList) => {
      const body = new FormData();
      for (const file of Array.from(files)) body.append("images", file);
      return api<SubjectDetail>(`/subjects/${subjectId}/images`, {
        method: "POST",
        body,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  const uploadFiles = upload.mutate;
  const uploading = upload.isPending;

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (uploading || isTypingTarget(event.target)) return;
      const files = imagesFromClipboard(event.clipboardData);
      if (files.length === 0) return;
      event.preventDefault();
      uploadFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadFiles, uploading]);

  const remove = useMutation({
    mutationFn: (url: string) =>
      api<SubjectDetail>(`/subjects/${subjectId}/images`, {
        method: "DELETE",
        body: JSON.stringify({ url }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["subject", subjectId], data);
      setPendingDelete(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subjects.images")}</CardTitle>
        <CardDescription>{t("subjects.imagesDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            {upload.isPending ? t("subjects.uploading") : t("subjects.uploadImages")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("subjects.pasteScreenshot")}</p>
          {upload.error ? <p className="text-sm text-destructive">{upload.error.message}</p> : null}
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("subjects.noImages")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((url, index) => (
              <li key={url} className="group relative overflow-hidden rounded-md border bg-muted/30">
                <button
                  type="button"
                  className="block aspect-square w-full"
                  onClick={() => setPreview(url)}
                  aria-label={t("common.previewNamed", { name: t("subjects.imageN", { n: String(index + 1) }) })}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 bg-background/80"
                  disabled={remove.isPending}
                  onClick={() => setPendingDelete(url)}
                  aria-label={t("common.deleteNamed", { name: t("subjects.imageN", { n: String(index + 1) }) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="inset-0 left-0 top-0 flex h-svh max-h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-none border-0 p-4 sm:rounded-none">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>{t("subjects.images")}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <img src={preview} alt="" className="min-h-0 flex-1 object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("subjects.deleteImage")}
        description={t("subjects.deleteImageDesc")}
        confirmLabel={remove.isPending ? t("common.deleting") : t("subjects.deleteImageBtn")}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete);
        }}
      />
    </Card>
  );
}
