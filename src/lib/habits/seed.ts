import { addDays, todayKey, weekday } from "./dates";
import type { Category, Habit, HabitData, Logs, Routine } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  "Health",
  "Fitness",
  "Coding",
  "Reading",
  "Learning",
  "Mindfulness",
  "Social",
  "Other",
].map((name) => ({ id: name.toLowerCase(), name, builtIn: true }));

export const DEFAULT_ROUTINES: Routine[] = [
  { id: "morning", name: "Morning", icon: "🌅" },
  { id: "afternoon", name: "Afternoon", icon: "☀️" },
  { id: "evening", name: "Evening", icon: "🌙" },
];

export const HABIT_COLORS = [
  "oklch(0.68 0.19 30)",
  "oklch(0.72 0.17 60)",
  "oklch(0.78 0.16 95)",
  "oklch(0.7 0.17 145)",
  "oklch(0.68 0.13 190)",
  "oklch(0.62 0.17 245)",
  "oklch(0.6 0.2 285)",
  "oklch(0.65 0.21 340)",
  "oklch(0.55 0.04 260)",
];

export const HABIT_ICONS = [
  "💧", "🏃", "🏋️", "🧘", "📚", "📖", "💻", "⌨️", "🧠", "✍️", "📓", "🎯",
  "🥗", "🍎", "💊", "😴", "🛏️", "🚶", "🚴", "🏊", "🤸", "🎸", "🎨", "🗣️",
  "📞", "❤️", "🌱", "☀️", "🌙", "🧹", "💰", "📵", "🚭", "☕", "🫖", "🦷",
  "🙏", "🌿", "🐕", "📝",
];

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyData(): HabitData {
  return {
    version: 1,
    habits: [],
    categories: DEFAULT_CATEGORIES,
    routines: DEFAULT_ROUTINES,
    logs: {},
    celebrated: [],
    sampleLoaded: false,
    goals: [],
  };
}

// Deterministic pseudo-random so sample history looks believable
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function sampleData(): HabitData {
  const today = todayKey();
  const start = addDays(today, -48);
  const mk = (
    name: string,
    icon: string,
    color: number,
    categoryId: string,
    routineId: string,
    frequency: Habit["frequency"],
    reminder?: string,
  ): Habit => ({
    id: uid(),
    name,
    icon,
    color: HABIT_COLORS[color],
    categoryId,
    routineId,
    frequency,
    reminder,
    archived: false,
    createdAt: start,
    sample: true,
  });
  const habits: Habit[] = [
    mk("Drink a glass of water", "💧", 5, "health", "morning", { type: "daily" }, "7:00 AM"),
    mk("Stretch 20 minutes", "🤸", 3, "fitness", "morning", { type: "daily" }),
    mk("Meditate", "🧘", 6, "mindfulness", "morning", { type: "weekly", times: 3 }),
    mk("Gym session", "🏋️", 0, "fitness", "afternoon", { type: "weekdays", days: [1, 3, 5] }, "6:00 PM"),
    mk("Code for 1 hour", "💻", 4, "coding", "afternoon", { type: "weekdays", days: [1, 2, 3, 4, 5] }),
    mk("Read 10 pages", "📚", 1, "reading", "evening", { type: "daily" }, "9:30 PM"),
    mk("Call a friend", "📞", 7, "social", "evening", { type: "weekly", times: 1 }),
  ];
  // success probabilities; gym is weaker on Fridays to give the coach a pattern
  const p = [0.92, 0.7, 0.55, 0.75, 0.8, 0.65, 0.3];
  const logs: Logs = {};
  const notes = ["felt tired, did a short version", "great energy today", "squeezed it in late", "did it with a friend"];
  habits.forEach((h, hi) => {
    logs[h.id] = {};
    for (let i = 0, d = start; d < today; i++, d = addDays(d, 1)) {
      const wd = weekday(d);
      if (h.frequency.type === "weekdays" && !h.frequency.days.includes(wd)) continue;
      let prob = p[hi];
      if (hi === 3 && wd === 5) prob = 0.2;
      if (hi === 1 && (wd === 0 || wd === 6)) prob = 0.35;
      const r = rand(hi * 997 + i * 31);
      if (r < prob) {
        const note = rand(hi * 13 + i * 7) < 0.08 ? notes[(hi + i) % notes.length] : undefined;
        logs[h.id][d] = note ? { done: true, note } : { done: true };
      }
    }
  });
  return { ...emptyData(), habits, logs, sampleLoaded: true };
}
