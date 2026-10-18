import { z } from "zod";
import { readStored } from "@/lib/browser-storage";
import { emptyData, sampleData } from "./seed";
import type { HabitData } from "./types";

export const HABITS_STORAGE_KEY = "habit-tracker-data-v1";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const habitSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), icon: z.string(), color: z.string(),
  categoryId: z.string(), routineId: z.string().nullable().default(null),
  frequency: z.discriminatedUnion("type", [
    z.object({ type: z.literal("daily") }),
    z.object({ type: z.literal("weekdays"), days: z.array(z.number().int().min(0).max(6)).min(1) }),
    z.object({ type: z.literal("weekly"), times: z.number().int().min(1).max(7) }),
  ]),
  reminder: z.string().optional(), archived: z.boolean().default(false), createdAt: date,
  sample: z.boolean().optional(),
});
const schema = z.object({
  version: z.literal(1), habits: z.array(habitSchema).default([]),
  categories: z.array(z.object({ id: z.string(), name: z.string(), builtIn: z.boolean() })).default(emptyData().categories),
  routines: z.array(z.object({ id: z.string(), name: z.string(), icon: z.string() })).default(emptyData().routines),
  logs: z.record(z.string(), z.record(date, z.object({ done: z.literal(true), note: z.string().optional() }))).default({}),
  celebrated: z.array(date).default([]), sampleLoaded: z.boolean().default(false),
});

export function parseHabitData(raw: string): HabitData | null {
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function loadHabitData(): HabitData {
  const raw = readStored(HABITS_STORAGE_KEY);
  // Keep invalid saved data intact rather than silently overwriting user history.
  return raw === null ? sampleData() : parseHabitData(raw) ?? emptyData();
}