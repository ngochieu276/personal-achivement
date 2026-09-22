import { z } from "zod";

export const TYPE_OF_RECORD = [
  "timePerRep",
  "repPerTime",
  "maximum",
  "fastest",
  "defineByUser",
] as const;

export const BETTER_DIRECTION = ["lowerIsBetter", "higherIsBetter"] as const;

export type TypeOfRecord = (typeof TYPE_OF_RECORD)[number];
export type BetterDirection = (typeof BETTER_DIRECTION)[number];

export const recordFieldShape = {
  typeOfRecord: z.enum(TYPE_OF_RECORD).optional().nullable(),
  betterDirection: z.enum(BETTER_DIRECTION).optional().nullable(),
};

export function withRecordRefine<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).refine(
    (value) => !("typeOfRecord" in value) || value.typeOfRecord !== "defineByUser" || Boolean(value.betterDirection),
    { message: "betterDirection is required when typeOfRecord is defineByUser", path: ["betterDirection"] },
  );
}

export function defaultBetterDirection(typeOfRecord: TypeOfRecord | null | undefined) {
  if (typeOfRecord === "timePerRep" || typeOfRecord === "fastest") return "lowerIsBetter";
  if (typeOfRecord === "repPerTime" || typeOfRecord === "maximum") return "higherIsBetter";
  return null;
}

export function recordWriteData(input: {
  typeOfRecord?: TypeOfRecord | null;
  betterDirection?: BetterDirection | null;
}, existing?: {
  typeOfRecord: TypeOfRecord | null;
  betterDirection: BetterDirection | null;
}) {
  if (existing && input.typeOfRecord === undefined && input.betterDirection === undefined) {
    return {
      typeOfRecord: existing.typeOfRecord,
      betterDirection: existing.betterDirection,
    };
  }

  const typeOfRecord = input.typeOfRecord === undefined
    ? existing?.typeOfRecord ?? null
    : input.typeOfRecord;

  if (!typeOfRecord) {
    return { typeOfRecord: null, betterDirection: null };
  }

  const betterDirection = typeOfRecord === "defineByUser"
    ? (input.betterDirection === undefined ? existing?.betterDirection ?? null : input.betterDirection)
    : defaultBetterDirection(typeOfRecord);

  return { typeOfRecord, betterDirection };
}

export function progressPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return (current / target) * 100;
}

export function averageProgressPercent(subjects: Array<{ currentProgress: number; kpi: number }>) {
  if (subjects.length === 0) return 0;
  const total = subjects.reduce((sum, subject) => sum + progressPercent(subject.currentProgress, subject.kpi), 0);
  return total / subjects.length;
}
