import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInput } from "@/lib/cycle";

export function SubjectRecordForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error?: string;
  onSubmit: (values: { date: string; recordNumber: number }) => void;
}) {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [recordNumber, setRecordNumber] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (recordNumber === "") return;
    onSubmit({ date, recordNumber: Number(recordNumber) });
    setRecordNumber("");
  }

  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="subject-record-date">Date</Label>
        <Input
          id="subject-record-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject-record-number">Number</Label>
        <Input
          id="subject-record-number"
          type="number"
          step="0.1"
          value={recordNumber}
          onChange={(event) => setRecordNumber(event.target.value)}
          required
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          Add record
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive sm:col-span-3">{error}</p> : null}
    </form>
  );
}
