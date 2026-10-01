import type { BetterDirection, TypeOfRecord } from "@/lib/types";
import { t } from "@/i18n";

export const TYPE_OF_RECORD = [
  "timePerRep",
  "repPerTime",
  "maximum",
  "fastest",
  "defineByUser",
] as const;

export const BETTER_DIRECTION = ["lowerIsBetter", "higherIsBetter"] as const;

export const typeOfRecordKeys = {
  timePerRep: "subjects.timePerRep",
  repPerTime: "subjects.repPerTime",
  maximum: "subjects.maximum",
  fastest: "subjects.fastest",
  defineByUser: "subjects.defineByUser",
} as const;

export function typeOfRecordLabel(type: TypeOfRecord) {
  return t(typeOfRecordKeys[type]);
}

export function betterDirectionLabel(direction: BetterDirection) {
  return direction === "lowerIsBetter" ? t("subjects.lowerIsBetter") : t("subjects.higherIsBetter");
}

export function defaultBetterDirection(typeOfRecord: TypeOfRecord | "") {
  if (typeOfRecord === "timePerRep" || typeOfRecord === "fastest") return "lowerIsBetter";
  if (typeOfRecord === "repPerTime" || typeOfRecord === "maximum") return "higherIsBetter";
  return "" as const;
}
