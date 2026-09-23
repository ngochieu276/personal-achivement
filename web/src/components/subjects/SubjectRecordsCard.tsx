import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubjectRecordForm } from "@/components/subjects/SubjectRecordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineContent, TimelineItem } from "@/components/ui/timeline";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { betterDirectionLabels, typeOfRecordLabels } from "@/lib/record";
import type { Subject, SubjectDetail, SubjectRecord } from "@/lib/types";

function recordList(records: SubjectRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

export function SubjectRecordsCard({ subject }: { subject: Subject }) {
  const queryClient = useQueryClient();
  const records = recordList(subject.records ?? []);
  const typeLabel = subject.typeOfRecord ? typeOfRecordLabels[subject.typeOfRecord] : null;
  const directionLabel = subject.betterDirection
    ? betterDirectionLabels[subject.betterDirection]
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
        <CardTitle>Records</CardTitle>
        <CardDescription>
          {typeLabel
            ? `${typeLabel}${directionLabel ? ` · ${directionLabel}` : ""}`
            : "Set a record type on this subject to start logging numbers."}
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
          <p className="text-sm text-muted-foreground">No records yet.</p>
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
