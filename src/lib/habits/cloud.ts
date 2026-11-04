import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_CATEGORIES, DEFAULT_ROUTINES, emptyData } from "./seed";
import type { Category, Frequency, Goal, Habit, HabitData, Logs, Routine } from "./types";

type Client = SupabaseClient<Database>;

/** Read every table for the signed-in user into the in-memory shape the app uses. */
export async function loadCloudData(sb: Client): Promise<HabitData> {
  const [cats, routs, habits, logs, goals, cele] = await Promise.all([
    sb.from("habit_categories").select("id,name,built_in").order("created_at"),
    sb.from("habit_routines").select("id,name,icon").order("created_at"),
    sb.from("habits").select("id,name,icon,color,category_id,routine_id,frequency,reminder,archived,created_on").order("created_at"),
    fetchAllLogs(sb),
    sb.from("habit_goals").select("id,name,habit_id,target_days,start_date,mode").order("created_at"),
    sb.from("habit_celebrations").select("day").order("day", { ascending: false }).limit(60),
  ]);
  const err = cats.error ?? routs.error ?? habits.error ?? goals.error ?? cele.error;
  if (err) throw err;
  const data = emptyData();
  data.categories = cats.data!.length
    ? cats.data!.map((c) => ({ id: c.id, name: c.name, builtIn: c.built_in }))
    : DEFAULT_CATEGORIES;
  data.routines = routs.data!.length ? routs.data!.map((r) => ({ id: r.id, name: r.name, icon: r.icon })) : DEFAULT_ROUTINES;
  data.habits = habits.data!.map((h) => ({
    id: h.id, name: h.name, icon: h.icon, color: h.color, categoryId: h.category_id, routineId: h.routine_id,
    frequency: h.frequency as unknown as Frequency, reminder: h.reminder ?? undefined, archived: h.archived, createdAt: h.created_on,
  }));
  data.logs = logs;
  data.goals = goals.data!.map((g) => ({ id: g.id, name: g.name, habitId: g.habit_id, targetDays: g.target_days, startDate: g.start_date, mode: g.mode === "consecutive" ? "consecutive" : "total" }));
  data.celebrated = cele.data!.map((c) => c.day).reverse();
  return data;
}

async function fetchAllLogs(sb: Client): Promise<Logs> {
  const logs: Logs = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("habit_logs").select("habit_id,day,note").order("day").range(from, from + 999);
    if (error) throw error;
    for (const r of data) (logs[r.habit_id] ??= {})[r.day] = r.note ? { done: true, note: r.note } : { done: true };
    if (data.length < 1000) break;
  }
  return logs;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const before = new Map(prev.map((x) => [x.id, x]));
  const after = new Set(next.map((x) => x.id));
  return {
    upsert: next.filter((x) => !same(before.get(x.id), x)),
    remove: prev.filter((x) => !after.has(x.id)).map((x) => x.id),
  };
}

/** Pushes the difference between the last saved snapshot and the current one. Sample rows never sync. */
export function computeDiff(prev: HabitData, next: HabitData) {
  const real = (d: HabitData) => d.habits.filter((h) => !h.sample);
  const logRows = (d: HabitData) => {
    const ids = new Set(real(d).map((h) => h.id));
    const out = new Map<string, { habit_id: string; day: string; note: string | null }>();
    for (const [habitId, days] of Object.entries(d.logs)) {
      if (!ids.has(habitId)) continue;
      for (const [day, e] of Object.entries(days)) if (!e.sample) out.set(`${habitId}|${day}`, { habit_id: habitId, day, note: e.note ?? null });
    }
    return out;
  };
  const pl = logRows(prev);
  const nl = logRows(next);
  return {
    categories: diffById<Category>(prev.categories, next.categories),
    routines: diffById<Routine>(prev.routines, next.routines),
    habits: diffById<Habit>(real(prev), real(next)),
    goals: diffById<Goal>(prev.goals.filter((g) => !prev.habits.find((h) => h.id === g.habitId)?.sample), next.goals.filter((g) => !next.habits.find((h) => h.id === g.habitId)?.sample)),
    logsUpsert: [...nl.entries()].filter(([k, v]) => !same(pl.get(k), v)).map(([, v]) => v),
    logsRemove: [...pl.entries()].filter(([k]) => !nl.has(k)).map(([, v]) => v),
    celebrated: next.celebrated.filter((d) => !prev.celebrated.includes(d)),
  };
}

export function diffIsEmpty(d: ReturnType<typeof computeDiff>) {
  return !d.categories.upsert.length && !d.categories.remove.length && !d.routines.upsert.length && !d.routines.remove.length &&
    !d.habits.upsert.length && !d.habits.remove.length && !d.goals.upsert.length && !d.goals.remove.length &&
    !d.logsUpsert.length && !d.logsRemove.length && !d.celebrated.length;
}

export async function pushDiff(sb: Client, userId: string, d: ReturnType<typeof computeDiff>) {
  const check = (r: { error: unknown }) => { if (r.error) throw r.error; };
  const user_id = userId;
  // Parents first so children never reference something missing.
  if (d.categories.upsert.length) check(await sb.from("habit_categories").upsert(d.categories.upsert.map((c) => ({ user_id, id: c.id, name: c.name, built_in: c.builtIn }))));
  if (d.routines.upsert.length) check(await sb.from("habit_routines").upsert(d.routines.upsert.map((r) => ({ user_id, id: r.id, name: r.name, icon: r.icon }))));
  if (d.habits.upsert.length) check(await sb.from("habits").upsert(d.habits.upsert.map((h) => ({
    user_id, id: h.id, name: h.name, icon: h.icon, color: h.color, category_id: h.categoryId, routine_id: h.routineId,
    frequency: h.frequency as unknown as Database["public"]["Tables"]["habits"]["Insert"]["frequency"], reminder: h.reminder ?? null, archived: h.archived, created_on: h.createdAt, updated_at: new Date().toISOString(),
  }))));
  if (d.goals.upsert.length) check(await sb.from("habit_goals").upsert(d.goals.upsert.map((g) => ({ user_id, id: g.id, name: g.name, habit_id: g.habitId, target_days: g.targetDays, start_date: g.startDate, mode: g.mode }))));
  for (let i = 0; i < d.logsUpsert.length; i += 500) check(await sb.from("habit_logs").upsert(d.logsUpsert.slice(i, i + 500).map((l) => ({ user_id, ...l }))));
  if (d.celebrated.length) check(await sb.from("habit_celebrations").upsert(d.celebrated.map((day) => ({ user_id, day }))));
  for (const l of d.logsRemove) check(await sb.from("habit_logs").delete().eq("user_id", user_id).eq("habit_id", l.habit_id).eq("day", l.day));
  if (d.goals.remove.length) check(await sb.from("habit_goals").delete().eq("user_id", user_id).in("id", d.goals.remove));
  if (d.habits.remove.length) {
    check(await sb.from("habit_logs").delete().eq("user_id", user_id).in("habit_id", d.habits.remove));
    check(await sb.from("habits").delete().eq("user_id", user_id).in("id", d.habits.remove));
  }
  if (d.routines.remove.length) check(await sb.from("habit_routines").delete().eq("user_id", user_id).in("id", d.routines.remove));
  if (d.categories.remove.length) check(await sb.from("habit_categories").delete().eq("user_id", user_id).in("id", d.categories.remove));
}

/** Snapshot that represents "nothing saved yet", so the first diff pushes default categories and routines. */
export function blankSnapshot(): HabitData {
  return { ...emptyData(), categories: [], routines: [] };
}
