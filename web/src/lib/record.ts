import type { BetterDirection, TypeOfRecord } from "@/lib/types";

export const TYPE_OF_RECORD = [
  "timePerRep",
  "repPerTime",
  "maximum",
  "fastest",
  "defineByUser",
] as const;

export const BETTER_DIRECTION = ["lowerIsBetter", "higherIsBetter"] as const;

export const typeOfRecordLabels: Record<TypeOfRecord, string> = {
  timePerRep: "Time per rep",
  repPerTime: "Reps per time",
  maximum: "Maximum",
  fastest: "Fastest",
  defineByUser: "Define by user",
};

export const betterDirectionLabels: Record<BetterDirection, string> = {
  lowerIsBetter: "Lower is better",
  higherIsBetter: "Higher is better",
};

export function defaultBetterDirection(typeOfRecord: TypeOfRecord | "") {
  if (typeOfRecord === "timePerRep" || typeOfRecord === "fastest") return "lowerIsBetter";
  if (typeOfRecord === "repPerTime" || typeOfRecord === "maximum") return "higherIsBetter";
  return "" as const;
}
