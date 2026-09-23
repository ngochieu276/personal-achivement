import { SubjectCard } from "@/components/subjects/SubjectCard";
import { periodGroupLabels, groupSubjectsByPeriod } from "@/lib/subjects";
import type { Subject } from "@/lib/types";
import type { ViewMode } from "@/stores/view";
import { viewClass } from "@/components/layout/ViewToggle";

export function SubjectPeriodGroups({
  subjects,
  variant,
  onEdit,
}: {
  subjects: Subject[];
  variant: ViewMode;
  onEdit: (subject: Subject) => void;
}) {
  const groups = groupSubjectsByPeriod(subjects);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.period} className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {periodGroupLabels[group.period]}
          </h2>
          <div className={viewClass(variant, "subjects")}>
            {group.subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                variant={variant}
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
