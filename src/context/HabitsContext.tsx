import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Goal, Habit, HabitData, Routine, StreakInfo } from "@/lib/habits/types";
import { emptyData, sampleData, uid } from "@/lib/habits/seed";
import { computeStreak, completionRate, dayProgress, isDone, isDue } from "@/lib/habits/logic";
import { todayKey } from "@/lib/habits/dates";
import { readStored, writeStored } from "@/lib/browser-storage";
import { HABITS_STORAGE_KEY, loadHabitData, parseHabitData } from "@/lib/habits/storage";

interface HabitsContextValue {
  ready: boolean;
  data: HabitData;
  activeHabits: Habit[];
  addHabit: (h: Omit<Habit, "id" | "createdAt" | "archived">) => Habit;
  addHabits: (hs: Omit<Habit, "id" | "createdAt" | "archived">[]) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggle: (habitId: string, key: string) => void;
  setNote: (habitId: string, key: string, note: string) => void;
  addCategory: (name: string) => Category;
  deleteCategory: (id: string) => void;
  addRoutine: (name: string, icon: string) => Routine;
  deleteRoutine: (id: string) => void;
  markCelebrated: (key: string) => void;
  clearSample: () => void;
  loadSample: () => void;
  resetAll: () => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, goal: Omit<Goal, "id">) => void;
  deleteGoal: (id: string) => void;
  // derived helpers
  isDone: (habitId: string, key: string) => boolean;
  isDue: (habit: Habit, key: string) => boolean;
  streak: (habit: Habit) => StreakInfo;
  rate30: (habit: Habit) => number | null;
  dayProgress: (key: string, habits?: Habit[]) => { due: number; done: number; pct: number | null };
  getHabit: (id: string) => Habit | undefined;
  categoryName: (id: string) => string;
  routineName: (id: string | null) => string;
}

const Ctx = createContext<HabitsContextValue | null>(null);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HabitData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadHabitData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const saved = readStored(HABITS_STORAGE_KEY);
    if (saved !== null && !parseHabitData(saved)) return;
    writeStored(HABITS_STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const addHabit = useCallback((h: Omit<Habit, "id" | "createdAt" | "archived">) => {
    const habit: Habit = { ...h, id: uid(), createdAt: todayKey(), archived: false };
    setData((d) => ({ ...d, habits: [...d.habits, habit] }));
    return habit;
  }, []);

  const addHabits = useCallback((hs: Omit<Habit, "id" | "createdAt" | "archived">[]) => {
    const created = hs.map((h) => ({ ...h, id: uid(), createdAt: todayKey(), archived: false }));
    setData((d) => ({ ...d, habits: [...d.habits, ...created] }));
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setData((d) => {
      const logs = { ...d.logs };
      delete logs[id];
      return { ...d, habits: d.habits.filter((h) => h.id !== id), logs, goals: d.goals.filter((g) => g.habitId !== id) };
    });
  }, []);

  const toggle = useCallback((habitId: string, key: string) => {
    setData((d) => {
      const hl = { ...(d.logs[habitId] ?? {}) };
      if (hl[key]) delete hl[key];
      else hl[key] = { done: true };
      return { ...d, logs: { ...d.logs, [habitId]: hl } };
    });
  }, []);

  const setNote = useCallback((habitId: string, key: string, note: string) => {
    setData((d) => {
      const hl = { ...(d.logs[habitId] ?? {}) };
      if (!hl[key]) return d;
      hl[key] = note.trim() ? { done: true, note: note.trim().slice(0, 200) } : { done: true };
      return { ...d, logs: { ...d.logs, [habitId]: hl } };
    });
  }, []);

  const addCategory = useCallback((name: string) => {
    const c: Category = { id: uid(), name: name.trim(), builtIn: false };
    setData((d) => ({ ...d, categories: [...d.categories, c] }));
    return c;
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      habits: d.habits.map((h) => (h.categoryId === id ? { ...h, categoryId: "other" } : h)),
    }));
  }, []);

  const addRoutine = useCallback((name: string, icon: string) => {
    const r: Routine = { id: uid(), name: name.trim(), icon };
    setData((d) => ({ ...d, routines: [...d.routines, r] }));
    return r;
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      routines: d.routines.filter((r) => r.id !== id),
      habits: d.habits.map((h) => (h.routineId === id ? { ...h, routineId: null } : h)),
    }));
  }, []);

  const markCelebrated = useCallback((key: string) => {
    setData((d) => (d.celebrated.includes(key) ? d : { ...d, celebrated: [...d.celebrated, key].slice(-60) }));
  }, []);

  const clearSample = useCallback(() => {
    setData((d) => {
      const ids = new Set(d.habits.filter((h) => h.sample).map((h) => h.id));
      const logs = Object.fromEntries(Object.entries(d.logs).filter(([k]) => !ids.has(k)));
      return { ...d, habits: d.habits.filter((h) => !h.sample), logs, goals: d.goals.filter((g) => !ids.has(g.habitId)), sampleLoaded: false, celebrated: [] };
    });
  }, []);

  const loadSample = useCallback(() => {
    setData((d) => {
      const s = sampleData();
      return { ...d, habits: [...d.habits, ...s.habits], logs: { ...d.logs, ...s.logs }, sampleLoaded: true };
    });
  }, []);

  const resetAll = useCallback(() => setData({ ...emptyData() }), []);

  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    setData((d) => ({ ...d, goals: [...d.goals, { ...goal, id: uid() }] }));
  }, []);
  const updateGoal = useCallback((id: string, goal: Omit<Goal, "id">) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => g.id === id ? { ...goal, id } : g) }));
  }, []);
  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const value = useMemo<HabitsContextValue>(() => {
    const activeHabits = data.habits.filter((h) => !h.archived);
    return {
      ready,
      data,
      activeHabits,
      addHabit,
      addHabits,
      updateHabit,
      deleteHabit,
      toggle,
      setNote,
      addCategory,
      deleteCategory,
      addRoutine,
      deleteRoutine,
      markCelebrated,
      clearSample,
      loadSample,
      resetAll,
      addGoal, updateGoal, deleteGoal,
      isDone: (id, key) => isDone(data.logs, id, key),
      isDue: (h, key) => isDue(h, data.logs, key),
      streak: (h) => computeStreak(h, data.logs),
      rate30: (h) => completionRate(h, data.logs, 30),
      dayProgress: (key, habits = activeHabits) => dayProgress(habits, data.logs, key),
      getHabit: (id) => data.habits.find((h) => h.id === id),
      categoryName: (id) => data.categories.find((c) => c.id === id)?.name ?? "Other",
      routineName: (id) => data.routines.find((r) => r.id === id)?.name ?? "Anytime",
    };
  }, [data, ready, addHabit, addHabits, updateHabit, deleteHabit, toggle, setNote, addCategory, deleteCategory, addRoutine, deleteRoutine, markCelebrated, clearSample, loadSample, resetAll, addGoal, updateGoal, deleteGoal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHabits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHabits must be used inside HabitsProvider");
  return v;
}
