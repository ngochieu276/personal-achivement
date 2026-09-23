import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineContent, TimelineItem } from "@/components/ui/timeline";
import { formatDate } from "@/lib/format";
import type { Subject } from "@/lib/types";

function collectRecords(subjects: Subject[]) {
  return subjects
    .flatMap((subject) =>
      (subject.records ?? []).map((record) => ({
        id: record.id,
        subjectName: subject.name,
        date: record.date,
        recordNumber: record.recordNumber,
      })),
    )
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function ProjectRecordsCard({ subjects }: { subjects: Subject[] }) {
  const records = collectRecords(subjects);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records</CardTitle>
        <CardDescription>Logged numbers from each subject.</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a record from a subject page to see it here.
          </p>
        ) : (
          <Timeline>
            {records.map((record) => (
              <TimelineItem key={record.id}>
                <TimelineContent>
                  <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                  <p className="text-sm">
                    <span className="font-medium">{record.subjectName}</span>
                    {" · "}
                    {record.recordNumber}
                  </p>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}
