import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { computeDiff, diffIsEmpty, loadCloudData, pushDiff } from "@/lib/habits/cloud";
import type { Category, Goal, Habit, HabitData, Routine, StreakInfo } from "@/lib/habits/types";
import { emptyData, sampleData, uid } from "@/lib/habits/seed";
import { computeStreak, completionRate, dayProgress, isDone, isDue } from "@/lib/habits/logic";
import { todayKey } from "@/lib/habits/dates";
import { readStored, removeStored, writeStored } from "@/lib/browser-storage";
import { HABITS_STORAGE_KEY, parseHabitData } from "@/lib/habits/storage";

export type SyncStatus = "idle" | "saving" | "error";

interface HabitsContextValue {
  ready: boolean;
  loadError: string | null;
  reload: () => void;
  syncStatus: SyncStatus;
  retrySync: () => void;
  /** Habits found in this browser from before accounts existed, awaiting an import decision. */
  localImport: HabitData | null;
  importLocal: () => void;
  skipImport: () => void;
  data: HabitData;
  activeHabits: Habit[];
  addHabit: (h: Omit<Habit, "id" | "createdAt" | "archived">) => Habit;
  addHabits: (hs: Omit<Habit, "id" | "createdAt" | "archived">[]) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggle: (habitId: string, key: string) => void;
  checkInGoal: (habitId: string, key: string) => void;
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<HabitData>(emptyData);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadNonce, setLoadNonce] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [localImport, setLocalImport] = useState<HabitData | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const snapshot = useRef<HabitData | null>(null);
  const flushing = useRef(false);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load this account's data from the cloud.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setReady(false);
    setLoadError(null);
    snapshot.current = null;
    loadCloudData(supabase)
      .then(({ data: loaded, snapshot: snap }) => {
        if (!active) return;
        snapshot.current = snap;
        setData(loaded);
        setReady(true);
        const raw = readStored(HABITS_STORAGE_KEY);
        const local = raw ? parseHabitData(raw) : null;
        const hasReal = local?.habits.some((h) => !h.sample);
        if (local && hasReal && readStored(`ht-import-skipped-${userId}`) !== "1") setLocalImport(local);
      })
      .catch(() => {
        if (active) setLoadError("We couldn't load your habits. Check your connection and try again.");
      });
    return () => {
      active = false;
    };
  }, [userId, loadNonce]);

  const flush = useCallback(async () => {
    if (!userId || !snapshot.current) return;
    if (flushing.current) {
      dirty.current = true;
      return;
    }
    flushing.current = true;
    const target = dataRef.current;
    const diff = computeDiff(snapshot.current, target);
    if (diffIsEmpty(diff)) {
      flushing.current = false;
      setSyncStatus("idle");
      return;
    }
    setSyncStatus("saving");
    try {
      await pushDiff(supabase, userId, diff);
      snapshot.current = structuredClone(target);
      setSyncStatus("idle");
    } catch {
      setSyncStatus((prev) => {
        if (prev !== "error") toast.error("Couldn't save your latest changes", { description: "They're kept on this device. We'll retry when you're back online.", action: { label: "Retry", onClick: () => void flushRef.current() } });
        return "error";
      });
    } finally {
      flushing.current = false;
      if (dirty.current) {
        dirty.current = false;
        void flushRef.current();
      }
    }
  }, [userId]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  // Optimistic: the UI already shows the change; save it shortly after.
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), 300);
  }, [data, ready]);

  useEffect(() => {
    const retry = () => void flushRef.current();
    window.addEventListener("online", retry);
    const flushOnHide = () => { if (document.visibilityState === "hidden") retry(); };
    document.addEventListener("visibilitychange", flushOnHide);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", flushOnHide);
    };
  }, []);

  const importLocal = useCallback(() => {
    const local = localImport;
    if (!local) return;
    setData((d) => {
      const realHabits = local.habits.filter((h) => !h.sample && !d.habits.some((x) => x.id === h.id));
      const ids = new Set(realHabits.map((h) => h.id));
      const logs = { ...d.logs };
      for (const id of ids) logs[id] = Object.fromEntries(Object.entries(local.logs[id] ?? {}).filter(([, e]) => !e.sample).map(([k, e]) => [k, e.note ? { done: true as const, note: e.note } : { done: true as const }]));
      return {
        ...d,
        habits: [...d.habits, ...realHabits.map(({ sample: _s, sampleHistoryTagged: _t, ...h }) => h)],
        logs,
        categories: [...d.categories, ...local.categories.filter((c) => !d.categories.some((x) => x.id === c.id))],
        routines: [...d.routines, ...local.routines.filter((r) => !d.routines.some((x) => x.id === r.id))],
        goals: [...d.goals, ...local.goals.filter((g) => ids.has(g.habitId) && !d.goals.some((x) => x.id === g.id))],
      };
    });
    removeStored(HABITS_STORAGE_KEY);
    setLocalImport(null);
    toast.success("Your habits were imported to your account");
  }, [localImport]);

  const skipImport = useCallback(() => {
    if (userId) writeStored(`ht-import-skipped-${userId}`, "1");
    setLocalImport(null);
  }, [userId]);

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
      hl[key] = note.trim() ? { ...hl[key], done: true, note: note.trim().slice(0, 200) } : { ...hl[key], done: true, note: undefined };
      return { ...d, logs: { ...d.logs, [habitId]: hl } };
    });
  }, []);

  const checkInGoal = useCallback((habitId: string, key: string) => {
    setData((d) => {
      const logs = { ...(d.logs[habitId] ?? {}) };
      if (logs[key]?.done && !logs[key]?.sample) delete logs[key];
      else logs[key] = { done: true };
      return { ...d, logs: { ...d.logs, [habitId]: logs } };
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
      loadError,
      reload: () => setLoadNonce((n) => n + 1),
      syncStatus,
      retrySync: () => void flushRef.current(),
      localImport,
      importLocal,
      skipImport,
      data,
      activeHabits,
      addHabit,
      addHabits,
      updateHabit,
      deleteHabit,
      toggle,
      checkInGoal,
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
  }, [data, ready, loadError, syncStatus, localImport, importLocal, skipImport, addHabit, addHabits, updateHabit, deleteHabit, toggle, checkInGoal, setNote, addCategory, deleteCategory, addRoutine, deleteRoutine, markCelebrated, clearSample, loadSample, resetAll, addGoal, updateGoal, deleteGoal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHabits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHabits must be used inside HabitsProvider");
  return v;
}
