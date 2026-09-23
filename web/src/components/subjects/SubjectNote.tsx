import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function SubjectNote({
  value,
  pending,
  error,
  onSave,
}: {
  value: string;
  pending: boolean;
  error?: string;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(value);

  useEffect(() => {
    setNote(value);
  }, [value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Note</CardTitle>
        <CardDescription>Write anything you want to remember for this subject.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => {
            if (note !== value) onSave(note);
          }}
          placeholder="Add a note..."
          disabled={pending}
          rows={10}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
