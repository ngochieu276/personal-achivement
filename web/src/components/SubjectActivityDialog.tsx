import { History } from "lucide-react";
import { KpiDoneList, SubjectHistory } from "@/components/SubjectHistory";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/FormDialog";
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
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Events and history"
      variant="scroll"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">This period events</h3>
            <p className="text-xs text-muted-foreground">KPI done in the current window.</p>
          </div>
          <KpiDoneList history={history} periodStart={periodStart} unit={unit} />
        </section>
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">History</h3>
            <p className="text-xs text-muted-foreground">
              KPI done, KPI updates, period results, and streak hits.
            </p>
          </div>
          <SubjectHistory history={history} unit={unit} />
        </section>
      </div>
    </FormDialog>
  );
}

export function SubjectActivityButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <History className="h-4 w-4" />
      Events & history
    </Button>
  );
}
