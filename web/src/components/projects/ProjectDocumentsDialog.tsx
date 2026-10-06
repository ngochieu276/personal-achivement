"use client";

import Link from "next/link";
import { FormDialog } from "@/components/shared/FormDialog";
import { ResourceLink } from "@/components/shared/ResourceLink";
import { YouTubePlayer } from "@/components/subjects/YouTubePlayer";
import { useI18n } from "@/i18n";
import { EntityIcon } from "@/lib/icons";
import { compareSubjects } from "@/lib/subjects";
import { youtubeVideoId } from "@/lib/youtube";
import type { Subject } from "@/lib/types";

export function ProjectDocumentsDialog({
  open,
  onOpenChange,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
}) {
  const { t } = useI18n();
  const groups = [...subjects]
    .sort(compareSubjects)
    .map((subject) => ({
      subject,
      documents: subject.documents ?? [],
    }))
    .filter((group) => group.documents.length > 0);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("projects.documentsTitle")}
      variant="scroll"
      className="max-w-2xl"
    >
      <p className="text-sm text-muted-foreground">{t("projects.documentsDesc")}</p>
      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("projects.documentsEmpty")}</p>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map(({ subject, documents }) => (
            <section key={subject.id} className="space-y-3">
              <Link
                href={`/subjects/${subject.id}`}
                className="flex min-w-0 items-center gap-2 text-sm font-medium hover:underline"
              >
                <EntityIcon name={subject.icon} className="h-4 w-4 shrink-0 text-secondary" />
                <span className="truncate">{subject.name}</span>
              </Link>
              <ul className="space-y-3">
                {documents.map((url) => (
                  <li key={url} className="space-y-2 rounded-md border p-3">
                    <p className="truncate text-sm">{url}</p>
                    <ResourceLink href={url} variant="full" />
                    {youtubeVideoId(url) ? <YouTubePlayer url={url} /> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </FormDialog>
  );
}
