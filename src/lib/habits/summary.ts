import { addDays, todayKey, weekStart, WEEKDAY_SHORT } from "./dates";
import { completionRate, computeStreak, describeFrequency, weekRate, weekdayBreakdown } from "./logic";
import type { HabitData } from "./types";

const pct = (v: number | null) => (v == null ? null : Math.round(v * 100));

/** Compact, model-friendly summary of the user's data for the AI coach. */
export function buildCoachSummary(data: HabitData) {
  const today = todayKey();
  const active = data.habits.filter((h) => !h.archived);
  const cat = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "Other";
  const rout = (id: string | null) => data.routines.find((r) => r.id === id)?.name ?? "Anytime";

  const habits = active.map((h) => {
    const s = computeStreak(h, data.logs);
    const wd = weekdayBreakdown(h, data.logs, 56);
    const byDay: Record<string, string> = {};
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      if (wd[d].due) byDay[WEEKDAY_SHORT[d]] = `${wd[d].done}/${wd[d].due}`;
    });
    const notes = Object.entries(data.logs[h.id] ?? {})
      .filter(([, e]) => e.note)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
      .map(([d, e]) => `${d}: ${e.note}`);
    const last14: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      last14.push(data.logs[h.id]?.[d] ? "x" : d < h.createdAt ? " " : ".");
    }
    return {
      habitId: h.id,
      name: h.name,
      category: cat(h.categoryId),
      routine: rout(h.routineId),
      frequency: describeFrequency(h.frequency),
      trackingSince: h.createdAt,
      currentStreak: `${s.current} ${s.unit}`,
      longestStreak: `${s.longest} ${s.unit}`,
      completionRate30dPct: pct(completionRate(h, data.logs, 30)),
      completionsByWeekday_last8w: byDay,
      last14days: last14.join(""),
      recentNotes: notes,
    };
  });

  const weeklyTrendPct: Record<string, number | null> = {};
  const cur = weekStart(today);
  for (let i = 5; i >= 0; i--) {
    const w = addDays(cur, -7 * i);
    weeklyTrendPct[`week of ${w}`] = pct(weekRate(active, data.logs, w));
  }

  return {
    legend: "last14days: oldest→today, x=done, .=not done, space=not tracked yet",
    routines: data.routines.map((r) => r.name),
    habitCount: active.length,
    habits,
    weeklyTrendPct,
  };
}
