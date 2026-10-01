"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
  const [note, setNote] = useState(value);

  useEffect(() => {
    setNote(value);
  }, [value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("subjects.note")}</CardTitle>
        <CardDescription>{t("subjects.noteDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => {
            if (note !== value) onSave(note);
          }}
          placeholder={t("subjects.notePlaceholder")}
          disabled={pending}
          rows={10}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
