"use client";

import { History } from "lucide-react";
import { KpiDoneList, SubjectHistory } from "@/components/subjects/SubjectHistory";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/shared/FormDialog";
import { useI18n } from "@/i18n";
import type { SubjectHistory as SubjectHistoryItem } from "@/lib/types";

export function SubjectActivityDialog({
  open,
  onOpenChange,
  history,
  periodStart,
  unit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SubjectHistoryItem[];
  periodStart: string;
  unit: string;
}) {
  const { t } = useI18n();
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("subjects.eventsHistory")}
      variant="scroll"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("subjects.thisPeriodEvents")}</h3>
            <p className="text-xs text-muted-foreground">{t("subjects.kpiDoneWindow")}</p>
          </div>
          <KpiDoneList history={history} periodStart={periodStart} unit={unit} />
        </section>
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("subjects.history")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("subjects.historyHint")}
            </p>
          </div>
          <SubjectHistory history={history} unit={unit} />
        </section>
      </div>
    </FormDialog>
  );
}

export function SubjectActivityButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <History className="h-4 w-4" />
      {t("subjects.eventsButton")}
    </Button>
  );
}
