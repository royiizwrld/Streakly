import { addDays, todayKey } from "./dates";
import type { Goal, Logs } from "./types";

/** Each check-in date counts once; backdated edits and undo recompute progress. */
export function goalProgress(goal: Goal, logs: Logs, today = todayKey()) {
  const dates = Object.keys(logs[goal.habitId] ?? {})
    .filter((date) => date >= goal.startDate && date <= today && logs[goal.habitId][date]?.done && !logs[goal.habitId][date]?.sample)
    .sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  const current = previous === today || previous === addDays(today, -1) ? run : 0;
  const achieved = goal.mode === "total" ? dates.length >= goal.targetDays : best >= goal.targetDays;
  const count = goal.mode === "total" ? dates.length : achieved ? best : current;
  return { count, best, achieved, pct: Math.min(100, (count / goal.targetDays) * 100) };
}