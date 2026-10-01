"use client";

import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { PeriodTimelineItem } from "@/components/subjects/PeriodTimelineItem";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/ui/timeline";
import { useI18n } from "@/i18n";
import type { SubjectEvent } from "@/lib/types";

export function PeriodTimeline({
  subjectId,
  projectId,
  events,
  unit,
}: {
  subjectId: string;
  projectId: string;
  events: SubjectEvent[];
  unit: string;
}) {
  return (
    <Timeline>
      {events.map((event) => (
        <PeriodTimelineItem
          key={event.id}
          subjectId={subjectId}
          projectId={projectId}
          event={event}
          unit={unit}
        />
      ))}
    </Timeline>
  );
}

export function SubjectTimelineButton({ subjectId }: { subjectId: string }) {
  const { t } = useI18n();
  return (
    <Button type="button" variant="outline" asChild>
      <Link href={`/subjects/${subjectId}/timeline`}>
        <CalendarRange className="h-4 w-4" />
        {t("subjects.timeline")}
      </Link>
    </Button>
  );
}
