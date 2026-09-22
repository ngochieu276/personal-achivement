import { Label } from "@/components/ui/label";
import {
  BETTER_DIRECTION,
  TYPE_OF_RECORD,
  betterDirectionLabels,
  defaultBetterDirection,
  typeOfRecordLabels,
} from "@/lib/record";
import type { BetterDirection, TypeOfRecord } from "@/lib/types";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SubjectRecordFields({
  typeOfRecord,
  betterDirection,
  onTypeOfRecordChange,
  onBetterDirectionChange,
}: {
  typeOfRecord: TypeOfRecord | "";
  betterDirection: BetterDirection | "";
  onTypeOfRecordChange: (value: TypeOfRecord | "") => void;
  onBetterDirectionChange: (value: BetterDirection | "") => void;
}) {
  function changeType(value: TypeOfRecord | "") {
    onTypeOfRecordChange(value);
    onBetterDirectionChange(defaultBetterDirection(value));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type-of-record">Type of record (optional)</Label>
        <select
          id="type-of-record"
          className={selectClass}
          value={typeOfRecord}
          onChange={(event) => changeType(event.target.value as TypeOfRecord | "")}
        >
          <option value="">None</option>
          {TYPE_OF_RECORD.map((value) => (
            <option key={value} value={value}>
              {typeOfRecordLabels[value]}
            </option>
          ))}
        </select>
      </div>
      {typeOfRecord ? (
        typeOfRecord === "defineByUser" ? (
          <div className="space-y-2">
            <Label htmlFor="better-direction">Better direction</Label>
            <select
              id="better-direction"
              className={selectClass}
              value={betterDirection}
              onChange={(event) => onBetterDirectionChange(event.target.value as BetterDirection)}
              required
            >
              <option value="" disabled>
                Select direction
              </option>
              {BETTER_DIRECTION.map((value) => (
                <option key={value} value={value}>
                  {betterDirectionLabels[value]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Better direction</Label>
            <p className="flex h-10 items-center text-sm text-muted-foreground">
              {betterDirection ? betterDirectionLabels[betterDirection] : "—"}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}
