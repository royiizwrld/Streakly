import { readStored, removeStored, writeStored } from "@/lib/browser-storage";
import { sampleData } from "@/lib/habits/seed";
import type { HabitData } from "@/lib/habits/types";

const KEY = "ht-demo-mode";

/** Demo mode lets signed-out visitors explore with in-memory sample data; nothing is saved. */
export const isDemoMode = () => readStored(KEY) === "1";
export const startDemoMode = () => writeStored(KEY, "1");
export const endDemoMode = () => removeStored(KEY);

const RENAMES: Record<string, string> = {
  "Drink a glass of water": "Morning Water",
  "Read 10 pages": "30-min Reading",
  "Stretch 20 minutes": "Evening Stretch",
};

export function demoData(): HabitData {
  const d = sampleData();
  return {
    ...d,
    habits: d.habits.map((h) =>
      RENAMES[h.name]
        ? { ...h, name: RENAMES[h.name], ...(h.name === "Stretch 20 minutes" ? { icon: "🧘", routineId: "evening" } : {}) }
        : h,
    ),
  };
}
