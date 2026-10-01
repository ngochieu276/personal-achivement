"use client";

import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import {
  BETTER_DIRECTION,
  TYPE_OF_RECORD,
  betterDirectionLabel,
  defaultBetterDirection,
  typeOfRecordLabel,
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
  const { t } = useI18n();

  function changeType(value: TypeOfRecord | "") {
    onTypeOfRecordChange(value);
    onBetterDirectionChange(defaultBetterDirection(value));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type-of-record">{t("subjects.typeOfRecord")}</Label>
        <select
          id="type-of-record"
          className={selectClass}
          value={typeOfRecord}
          onChange={(event) => changeType(event.target.value as TypeOfRecord | "")}
        >
          <option value="">{t("common.none")}</option>
          {TYPE_OF_RECORD.map((value) => (
            <option key={value} value={value}>
              {typeOfRecordLabel(value)}
            </option>
          ))}
        </select>
      </div>
      {typeOfRecord ? (
        typeOfRecord === "defineByUser" ? (
          <div className="space-y-2">
            <Label htmlFor="better-direction">{t("subjects.betterDirection")}</Label>
            <select
              id="better-direction"
              className={selectClass}
              value={betterDirection}
              onChange={(event) => onBetterDirectionChange(event.target.value as BetterDirection)}
              required
            >
              <option value="" disabled>
                {t("subjects.selectDirection")}
              </option>
              {BETTER_DIRECTION.map((value) => (
                <option key={value} value={value}>
                  {betterDirectionLabel(value)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{t("subjects.betterDirection")}</Label>
            <p className="flex h-10 items-center text-sm text-muted-foreground">
              {betterDirection ? betterDirectionLabel(betterDirection) : "—"}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}
