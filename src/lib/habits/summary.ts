import { addDays, daysBetween, todayKey, weekStart, WEEKDAY_SHORT } from "./dates";
import { completionRate, computeStreak, dayProgress, describeFrequency, isScheduled, weekRate, weekdayBreakdown } from "./logic";
import { goalProgress } from "./goals";
import type { HabitData, Logs } from "./types";

const pct = (v: number | null) => (v == null ? null : Math.round(v * 100));

/** Compact, model-friendly summary of the user's data for the AI coach. */
export function buildCoachSummary(data: HabitData, today = todayKey()) {
  const logs: Logs = Object.fromEntries(Object.entries(data.logs).map(([id, entries]) => [id,
    Object.fromEntries(Object.entries(entries).filter(([date, entry]) => !entry.sample && date <= today)),
  ]));
  const active = data.habits.filter((h) => !h.archived).flatMap((h) => {
    if (!h.sample) return [h];
    const firstReal = Object.keys(logs[h.id] ?? {}).sort()[0];
    return firstReal ? [{ ...h, createdAt: firstReal }] : [];
  });
  const cat = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "Other";
  const rout = (id: string | null) => data.routines.find((r) => r.id === id)?.name ?? "Anytime";

  const habits = active.map((h) => {
    const s = computeStreak(h, logs, today);
    const wd = weekdayBreakdown(h, logs, 56, today);
    const byDay: Record<string, string> = {};
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      if (wd[d].due) byDay[WEEKDAY_SHORT[d]] = h.frequency.type === "weekly" ? `${wd[d].done} check-ins` : `${wd[d].done}/${wd[d].due}`;
    });
    const notes = Object.entries(logs[h.id] ?? {})
      .filter(([, e]) => e.note)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
      .map(([d, e]) => `${d}: ${e.note}`);
    const last14: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      last14.push(logs[h.id]?.[d] ? "x" : d < h.createdAt ? " " : d === today ? "p" : h.frequency.type === "weekly" ? "o" : isScheduled(h, d) ? "." : "-");
    }
    return {
      habitId: h.id,
      name: h.name,
      category: cat(h.categoryId),
      routine: rout(h.routineId),
      frequency: describeFrequency(h.frequency),
      trackingSince: h.createdAt,
      trackedDays: Math.max(0, daysBetween(h.createdAt, today) + 1),
      totalCheckIns: Object.keys(logs[h.id] ?? {}).length,
      currentStreak: `${s.current} ${s.unit}`,
      longestStreak: `${s.longest} ${s.unit}`,
      completionRate30dPct: pct(completionRate(h, logs, 30, today)),
      weekdayMetric: h.frequency.type === "weekly" ? "check-in distribution, not missed days" : "completed/scheduled days",
      completionsByWeekday_last8w: byDay,
      last14days: last14.join(""),
      recentNotes: notes,
    };
  });

  const weeklyTrendPct: Record<string, number | null> = {};
  const cur = weekStart(today);
  for (let i = 5; i >= 0; i--) {
    const w = addDays(cur, -7 * i);
    weeklyTrendPct[`week of ${w}`] = pct(weekRate(active, logs, w, today));
  }

  return {
    source: "personal_check_ins_only",
    asOf: today,
    excludedSampleCheckIns: Object.values(data.logs).flatMap((entries) => Object.values(entries)).filter((entry) => entry.sample).length,
    hasUserHistory: active.some((habit) => Object.keys(logs[habit.id] ?? {}).length > 0),
    legend: "last14days: oldest→today, x=done, .=missed scheduled day, -=not scheduled, o=optional weekly opportunity, p=today pending, space=not tracked yet",
    routines: data.routines.map((r) => r.name),
    habitCount: active.length,
    habits,
    weeklyTrendPct,
    recentDays: Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i - 13);
      const progress = dayProgress(active, logs, date);
      return { date, ...progress, pending: date === today, missedHabitIds: date === today ? [] : active.filter((h) => h.frequency.type !== "weekly" && isScheduled(h, date) && !logs[h.id]?.[date]).map((h) => h.id) };
    }),
    goals: (data.goals ?? []).filter((g) => active.some((h) => h.id === g.habitId)).map((g) => ({ ...g, ...goalProgress(g, logs, today) })),
  };
}
