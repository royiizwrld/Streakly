import { addDays, daysBetween, todayKey, weekStart, weekday } from "./dates";
import type { Frequency, Habit, Logs, StreakInfo } from "./types";

export function isDone(logs: Logs, habitId: string, key: string): boolean {
  return !!logs[habitId]?.[key];
}

/** Whether the habit is on the schedule for that date (ignores weekly progress). */
export function isScheduled(habit: Habit, key: string): boolean {
  if (key < habit.createdAt) return false;
  const f = habit.frequency;
  if (f.type === "daily") return true;
  if (f.type === "weekdays") return f.days.includes(weekday(key));
  return true;
}

/** Completions for a weekly habit in the week containing `key`, strictly before `key`. */
export function weekCountBefore(logs: Logs, habitId: string, key: string): number {
  let n = 0;
  for (let d = weekStart(key); d < key; d = addDays(d, 1)) if (isDone(logs, habitId, d)) n++;
  return n;
}

export function weekCount(logs: Logs, habitId: string, key: string): number {
  const start = weekStart(key);
  let n = 0;
  for (let i = 0; i < 7; i++) if (isDone(logs, habitId, addDays(start, i))) n++;
  return n;
}

/** Count in the week up to and including `key`. */
export function weekCountThrough(logs: Logs, habitId: string, key: string): number {
  return weekCountBefore(logs, habitId, key) + (isDone(logs, habitId, key) ? 1 : 0);
}

/**
 * Due = should appear on that day's checklist.
 * Weekly-target habits stay due until the weekly target is reached (and remain
 * visible on the day they were checked).
 */
export function isDue(habit: Habit, logs: Logs, key: string): boolean {
  if (habit.archived || !isScheduled(habit, key)) return false;
  if (habit.frequency.type !== "weekly") return true;
  return isDone(logs, habit.id, key) || weekCountBefore(logs, habit.id, key) < habit.frequency.times;
}

export function computeStreak(habit: Habit, logs: Logs, today = todayKey()): StreakInfo {
  const f = habit.frequency;
  if (f.type === "weekly") {
    const weeks: boolean[] = [];
    const curWeek = weekStart(today);
    for (let w = weekStart(habit.createdAt); w <= curWeek; w = addDays(w, 7)) {
      weeks.push(weekCount(logs, habit.id, w) >= f.times);
    }
    let longest = 0;
    let run = 0;
    for (const met of weeks) {
      run = met ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    let current = 0;
    let i = weeks.length - 1;
    if (i >= 0 && !weeks[i]) i--; // current week still in progress
    for (; i >= 0 && weeks[i]; i--) current++;
    return { current, longest, unit: "weeks" };
  }

  const scheduled: string[] = [];
  for (let d = habit.createdAt; d <= today; d = addDays(d, 1)) if (isScheduled(habit, d)) scheduled.push(d);
  let longest = 0;
  let run = 0;
  for (const d of scheduled) {
    run = isDone(logs, habit.id, d) ? run + 1 : d === today ? run : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = scheduled.length - 1;
  if (i >= 0 && scheduled[i] === today && !isDone(logs, habit.id, today)) i--; // today not over yet
  for (; i >= 0 && isDone(logs, habit.id, scheduled[i]); i--) current++;
  return { current, longest, unit: "days" };
}

/** Completion rate (0..1) over the last `days` days ending today, or null when no history. */
export function completionRate(habit: Habit, logs: Logs, days = 30, today = todayKey()): number | null {
  const start = addDays(today, -(days - 1));
  const from = start > habit.createdAt ? start : habit.createdAt;
  if (from > today) return null;
  const f = habit.frequency;
  if (f.type === "weekly") {
    const span = daysBetween(from, today) + 1;
    let done = 0;
    for (let d = from; d <= today; d = addDays(d, 1)) if (isDone(logs, habit.id, d)) done++;
    const expected = (f.times * span) / 7;
    return expected <= 0 ? null : Math.min(1, done / expected);
  }
  let due = 0;
  let done = 0;
  for (let d = from; d <= today; d = addDays(d, 1)) {
    if (!isScheduled(habit, d)) continue;
    if (d === today && !isDone(logs, habit.id, d)) continue;
    due++;
    if (isDone(logs, habit.id, d)) done++;
  }
  return due === 0 ? null : done / due;
}

/** Overall day completion: share of due habits completed that day. */
export function dayProgress(habits: Habit[], logs: Logs, key: string) {
  const due = habits.filter((h) => isDue(h, logs, key));
  const done = due.filter((h) => isDone(logs, h.id, key)).length;
  return { due: due.length, done, pct: due.length ? done / due.length : null };
}

/** Per-weekday completion (0=Sun) for a habit over its history (last `days`). */
export function weekdayBreakdown(habit: Habit, logs: Logs, days = 56, today = todayKey()) {
  const out = Array.from({ length: 7 }, () => ({ due: 0, done: 0 }));
  const start = addDays(today, -(days - 1));
  for (let d = start > habit.createdAt ? start : habit.createdAt; d <= today; d = addDays(d, 1)) {
    const wd = weekday(d);
    const done = isDone(logs, habit.id, d);
    if (habit.frequency.type === "weekly") {
      if (done) out[wd].done++;
      out[wd].due++;
      continue;
    }
    if (!isScheduled(habit, d) || (d === today && !done)) continue;
    out[wd].due++;
    if (done) out[wd].done++;
  }
  return out;
}

/** Weekly completion rate across habits for a week starting at `start`. */
export function weekRate(habits: Habit[], logs: Logs, start: string, today = todayKey()) {
  let due = 0;
  let done = 0;
  for (const h of habits) {
    if (h.frequency.type === "weekly") {
      if (addDays(start, 6) < h.createdAt || start > today) continue;
      due += h.frequency.times;
      done += Math.min(h.frequency.times, weekCount(logs, h.id, start));
      continue;
    }
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      if (d > today || !isScheduled(h, d)) continue;
      const isDoneD = isDone(logs, h.id, d);
      if (d === today && !isDoneD) continue;
      due++;
      if (isDoneD) done++;
    }
  }
  return due ? done / due : null;
}

export function describeFrequency(f: Frequency): string {
  if (f.type === "daily") return "Every day";
  if (f.type === "weekly") return `${f.times}× per week`;
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sorted = [...f.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (sorted.length === 5 && !sorted.includes(0) && !sorted.includes(6)) return "Weekdays";
  return sorted.map((d) => names[d]).join(" / ");
}
