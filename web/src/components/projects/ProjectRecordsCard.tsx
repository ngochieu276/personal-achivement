import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timeline, TimelineContent, TimelineItem } from "@/components/ui/timeline";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { toDateInput } from "@/lib/cycle";
import { typeOfRecordLabels } from "@/lib/record";
import type { Subject, SubjectDetail } from "@/lib/types";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type TimelineRecord = {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  recordNumber: number;
};

function collectRecords(subjects: Subject[]): TimelineRecord[] {
  return subjects
    .flatMap((subject) =>
      (subject.records ?? []).map((record) => ({
        id: record.id,
        subjectId: subject.id,
        subjectName: subject.name,
        date: record.date,
        recordNumber: record.recordNumber,
      })),
    )
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function ProjectRecordsCard({
  projectId,
  subjects,
}: {
  projectId: string;
  subjects: Subject[];
}) {
  const queryClient = useQueryClient();
  const recordSubjects = subjects.filter((subject) => subject.typeOfRecord);
  const [subjectId, setSubjectId] = useState(recordSubjects[0]?.id ?? "");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [recordNumber, setRecordNumber] = useState("");
  const records = collectRecords(subjects);

  useEffect(() => {
    if (!subjectId && recordSubjects[0]) setSubjectId(recordSubjects[0].id);
  }, [recordSubjects, subjectId]);

  const addRecord = useMutation({
    mutationFn: () =>
      api<SubjectDetail>(`/subjects/${subjectId}/records`, {
        method: "POST",
        body: JSON.stringify({ date, recordNumber: Number(recordNumber) }),
      }),
    onSuccess: async () => {
      setRecordNumber("");
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!subjectId || recordNumber === "") return;
    addRecord.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records</CardTitle>
        <CardDescription>Personal bests and logged numbers by date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {recordSubjects.length > 0 ? (
          <form className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto]" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="record-subject">Subject</Label>
              <select
                id="record-subject"
                className={selectClass}
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                {recordSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                    {subject.typeOfRecord ? ` · ${typeOfRecordLabels[subject.typeOfRecord]}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-date">Date</Label>
              <Input
                id="record-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-value">Number</Label>
              <Input
                id="record-value"
                type="number"
                step="0.1"
                value={recordNumber}
                onChange={(event) => setRecordNumber(event.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={addRecord.isPending}>
                Add
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Set a record type on a subject to start logging numbers.
          </p>
        )}
        {addRecord.error ? (
          <p className="text-sm text-destructive">{addRecord.error.message}</p>
        ) : null}
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
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
