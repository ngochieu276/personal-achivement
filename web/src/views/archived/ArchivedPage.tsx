"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { CardListSkeleton } from "@/components/layout/CardListSkeleton";
import { ListPlaceholder } from "@/components/layout/ListPlaceholder";
import { Page, PageHeader } from "@/components/layout/PageHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { ViewToggle } from "@/components/layout/ViewToggle";
import { SubjectPeriodGroups } from "@/components/subjects/SubjectPeriodGroups";
import { SubjectFormDialog } from "@/components/subjects/SubjectFormDialog";
import { subjectToFormValues, type SubjectFormValues } from "@/components/subjects/SubjectForm";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { EntityIcon } from "@/lib/icons";
import { groupArchivedByProject } from "@/lib/subjects";
import type { Subject, SubjectDetail, SubjectStatus } from "@/lib/types";
import { useViewStore } from "@/stores/view";

export function ArchivedPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const mode = useViewStore((state) => state.mode);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const archivedQuery = useQuery({
    queryKey: ["archived-subjects"],
    queryFn: () => api<{ subjects: Subject[] }>("/subjects?status=pending"),
  });

  const updateSubject = useMutation({
    mutationFn: (values: SubjectFormValues) =>
      api<SubjectDetail>(`/subjects/${editingSubject?.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async (data) => {
      setEditingSubject(null);
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateSubjectStatus = useMutation({
    mutationFn: ({
      subjectId,
      status,
      statusComment,
    }: {
      subjectId: string;
      status: SubjectStatus;
      statusComment: string | null;
    }) =>
      api<SubjectDetail>(`/subjects/${subjectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, statusComment }),
      }),
    onSuccess: async (data) => {
      if (data.subject.status !== "pending") setEditingSubject(null);
      else {
        setEditingSubject((current) =>
          current && current.id === data.subject.id ? { ...current, ...data.subject } : current,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["archived-subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project", data.subject.projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const subjects = archivedQuery.data?.subjects ?? [];
  const groups = groupArchivedByProject(subjects);

  return (
    <Page>
      <PageHeader eyebrow={t("archived.eyebrow")} title={t("archived.title")} actions={<ViewToggle />} />

      <SubjectFormDialog
        open={Boolean(editingSubject)}
        onOpenChange={(next) => {
          if (!next) setEditingSubject(null);
        }}
        title={t("subjects.edit")}
        formKey={editingSubject?.id}
        initial={editingSubject ? subjectToFormValues(editingSubject) : undefined}
        submitLabel={t("subjects.save")}
        pending={updateSubject.isPending}
        error={updateSubject.error?.message}
        onSubmit={(values) => updateSubject.mutate(values)}
        status={editingSubject?.status}
        statusComment={editingSubject?.statusComment}
        statusPending={updateSubjectStatus.isPending}
        statusError={updateSubjectStatus.error?.message}
        onUpdateStatus={async (status, statusComment) => {
          if (!editingSubject) return;
          await updateSubjectStatus.mutateAsync({ subjectId: editingSubject.id, status, statusComment });
        }}
      />

      {archivedQuery.isLoading ? (
        <PageLoading label={t("archived.loading")}>
          <CardListSkeleton kind="subjects" />
        </PageLoading>
      ) : subjects.length === 0 ? (
        <ListPlaceholder variant="empty" title={t("archived.emptyTitle")} description={t("archived.emptyDesc")} />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.projectId} className="space-y-4">
              <div className="flex items-center gap-2">
                <EntityIcon name={group.icon} className="h-5 w-5 text-secondary" />
                <Link href={`/projects/${group.projectId}`} className="font-serif text-xl hover:underline">
                  {group.name || t("breadcrumb.project")}
                </Link>
                <Badge variant="outline">{group.subjects.length}</Badge>
              </div>
              <SubjectPeriodGroups subjects={group.subjects} variant={mode} onEdit={setEditingSubject} />
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
