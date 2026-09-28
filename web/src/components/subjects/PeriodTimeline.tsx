import { CalendarRange } from "lucide-react";
import { Link } from "react-router-dom";
import { PeriodTimelineItem } from "@/components/subjects/PeriodTimelineItem";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/ui/timeline";
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
  return (
    <Button type="button" variant="outline" asChild>
      <Link to={`/subjects/${subjectId}/timeline`}>
        <CalendarRange className="h-4 w-4" />
        Timeline
      </Link>
    </Button>
  );
}
