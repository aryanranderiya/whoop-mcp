import { z } from "zod";
import { HISTORY_DEFAULT_LIMIT, MAX_PAGE_LIMIT } from "../constants";
import { windowToRange } from "../whoop/transform";

export const listInput = z.object({
  days: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Lookback window in days. Ignored if start/end are provided."),
  start: z.iso.datetime().optional().describe("ISO-8601 start (inclusive)."),
  end: z.iso.datetime().optional().describe("ISO-8601 end (exclusive)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .optional()
    .describe("Max records to return (<= 25)."),
});
export type ListInput = z.infer<typeof listInput>;

export function resolveRange(
  p: ListInput,
  defaultDays: number,
): { start?: string; end?: string } {
  return p.start || p.end
    ? { start: p.start, end: p.end }
    : windowToRange(p.days ?? defaultDays);
}

export function resolveLimit(
  p: ListInput,
  def: number = HISTORY_DEFAULT_LIMIT,
): number {
  return Math.min(p.limit ?? def, MAX_PAGE_LIMIT);
}
