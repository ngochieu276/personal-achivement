import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubjectFileItem } from "@/components/subjects/SubjectFileItem";
import { SubjectFilePreview } from "@/components/subjects/SubjectFilePreview";
import { SubjectFileUpload } from "@/components/subjects/SubjectFileUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { SubjectDetail, SubjectFile } from "@/lib/types";

export function SubjectFiles({
  subjectId,
  files,
}: {
  subjectId: string;
  files: SubjectFile[];
}) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<SubjectFile | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SubjectFile | null>(null);

  const remove = useMutation({
    mutationFn: (fileId: string) => api(`/subjects/${subjectId}/files/${fileId}`, { method: "DELETE" }),
    onSuccess: (_data, fileId) => {
      queryClient.setQueryData(["subject", subjectId], (current: SubjectDetail | undefined) => {
        if (!current) return current;
        return { ...current, files: (current.files ?? []).filter((item) => item.id !== fileId) };
      });
      setPendingDelete(null);
    },
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Files</CardTitle>
        <CardDescription>Images, PDFs, Word, and Excel. Preview, download, or delete.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SubjectFileUpload subjectId={subjectId} />
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <SubjectFileItem
                key={file.id}
                subjectId={subjectId}
                file={file}
                pending={remove.isPending}
                onPreview={() => setPreview(file)}
                onDelete={() => setPendingDelete(file)}
              />
            ))}
          </ul>
        )}
      </CardContent>
      <SubjectFilePreview
        subjectId={subjectId}
        file={preview}
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete file?"
        description={pendingDelete ? `This permanently deletes “${pendingDelete.name}”.` : ""}
        confirmLabel={remove.isPending ? "Deleting..." : "Delete file"}
        pending={remove.isPending}
        error={remove.error?.message}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
        }}
      />
    </Card>
  );
}
