"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubjectRecordForm } from "@/components/subjects/SubjectRecordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineContent, TimelineItem } from "@/components/ui/timeline";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { betterDirectionLabel, typeOfRecordLabel } from "@/lib/record";
import type { Subject, SubjectDetail, SubjectRecord } from "@/lib/types";

function recordList(records: SubjectRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

export function SubjectRecordsCard({ subject }: { subject: Subject }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const records = recordList(subject.records ?? []);
  const typeLabel = subject.typeOfRecord ? typeOfRecordLabel(subject.typeOfRecord) : null;
  const directionLabel = subject.betterDirection
    ? betterDirectionLabel(subject.betterDirection)
    : null;

  const addRecord = useMutation({
    mutationFn: (values: { date: string; recordNumber: number }) =>
      api<SubjectDetail>(`/subjects/${subject.id}/records`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["subject", subject.id], data);
      await queryClient.invalidateQueries({ queryKey: ["subjects", subject.projectId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subjects.records")}</CardTitle>
        <CardDescription>
          {typeLabel
            ? `${typeLabel}${directionLabel ? ` · ${directionLabel}` : ""}`
            : t("subjects.recordsHint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {subject.typeOfRecord ? (
          <SubjectRecordForm
            pending={addRecord.isPending}
            error={addRecord.error?.message}
            onSubmit={(values) => addRecord.mutate(values)}
          />
        ) : null}
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("subjects.noRecords")}</p>
        ) : (
          <Timeline>
            {records.map((record) => (
              <TimelineItem key={record.id}>
                <TimelineContent>
                  <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                  <p className="text-sm font-medium">{record.recordNumber}</p>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
