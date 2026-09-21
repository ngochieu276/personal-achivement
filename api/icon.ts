import { z } from "zod";

export const iconSchema = z
  .string()
  .trim()
  .max(48)
  .regex(/^[A-Za-z0-9]*$/, "Invalid icon")
  .optional()
  .nullable();

export function normalizeIcon(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value) return null;
  return value;
}
