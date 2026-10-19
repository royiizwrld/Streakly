import { describe, expect, it } from "vitest";
import { computeStreak, isDue, weekRate } from "./logic";
import type { Habit, Logs } from "./types";

const base: Omit<Habit, "frequency"> = {
  id: "h",
  name: "x",
  icon: "x",
  color: "red",
  categoryId: "c",
  routineId: null,
  archived: false,
  createdAt: "2026-09-01",
};

const logsFor = (days: string[]): Logs => ({
  h: Object.fromEntries(days.map((d) => [d, { done: true as const }])),
});

describe("habit logic", () => {
  it("weekday habits keep streak across non-due days", () => {
    // Mon/Wed/Fri — 2026-10-12 is a Monday
    const h: Habit = { ...base, frequency: { type: "weekdays", days: [1, 3, 5] } };
    const logs = logsFor(["2026-10-12", "2026-10-14", "2026-10-16"]);
    expect(computeStreak(h, logs, "2026-10-18").current).toBe(3);
  });

  it("an unchecked today does not break a daily streak", () => {
    const h: Habit = { ...base, frequency: { type: "daily" } };
    const logs = logsFor(["2026-10-15", "2026-10-16"]);
    expect(computeStreak(h, logs, "2026-10-17").current).toBe(2);
  });

  it("weekly target habits count consecutive met weeks", () => {
    const h: Habit = { ...base, frequency: { type: "weekly", times: 2 } };
    // weeks of Oct 5 and Oct 12 met, current week (Oct 19) in progress
    const logs = logsFor(["2026-10-05", "2026-10-07", "2026-10-13", "2026-10-15"]);
    expect(computeStreak(h, logs, "2026-10-19")).toMatchObject({ current: 2, unit: "weeks" });
  });

  it("weekly habit stays due until weekly target is hit", () => {
    const h: Habit = { ...base, frequency: { type: "weekly", times: 2 } };
    const logs = logsFor(["2026-10-12", "2026-10-13"]);
    expect(isDue(h, logs, "2026-10-14")).toBe(false);
    expect(isDue(h, logsFor(["2026-10-12"]), "2026-10-14")).toBe(true);
  });

  it("an in-progress week does not count unfinished weekly targets as missed", () => {
    const h: Habit = { ...base, frequency: { type: "weekly", times: 3 } };
    // Week of Mon 2026-10-12, viewed on Tuesday with one check-in
    expect(weekRate([h], logsFor(["2026-10-12"]), "2026-10-12", "2026-10-13")).toBe(1);
    expect(weekRate([h], logsFor([]), "2026-10-12", "2026-10-13")).toBeNull();
  });

  it("a finished week counts the full weekly target", () => {
    const h: Habit = { ...base, frequency: { type: "weekly", times: 3 } };
    expect(weekRate([h], logsFor(["2026-10-12"]), "2026-10-12", "2026-10-20")).toBeCloseTo(1 / 3);
  });
});
