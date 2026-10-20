export type Frequency =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] } // 0 = Sunday … 6 = Saturday
  | { type: "weekly"; times: number };

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string; // css color string (oklch)
  categoryId: string;
  routineId: string | null;
  frequency: Frequency;
  reminder?: string;
  archived: boolean;
  createdAt: string; // YYYY-MM-DD
  sample?: boolean;
  sampleHistoryTagged?: boolean;
}

export interface Category {
  id: string;
  name: string;
  builtIn: boolean;
}

export interface Routine {
  id: string;
  name: string;
  icon: string;
}

export interface LogEntry {
  done: true;
  note?: string;
  sample?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  habitId: string;
  targetDays: number;
  startDate: string;
  mode: "total" | "consecutive";
}

/** logs[habitId][YYYY-MM-DD] = entry (present only when completed) */
export type Logs = Record<string, Record<string, LogEntry>>;

export interface HabitData {
  version: 1;
  habits: Habit[];
  categories: Category[];
  routines: Routine[];
  logs: Logs;
  celebrated: string[];
  sampleLoaded: boolean;
  goals: Goal[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  unit: "days" | "weeks";
}
