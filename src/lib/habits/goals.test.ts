import { describe, expect, it } from "vitest";
import { goalProgress } from "./goals";
import { parseHabitData } from "./storage";
import type { Goal, Logs } from "./types";

const goal: Goal = { id: "g", habitId: "reading", name: "30 days of daily reading", targetDays: 30, startDate: "2026-09-01", mode: "total" };
describe("Habit-linked goals", () => {
  it("completes 30 days of reading from 30 distinct check-ins", () => {
    const logs: Logs = { reading: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`2026-09-${String(i + 1).padStart(2, "0")}`, { done: true }])) };
    expect(goalProgress(goal, logs, "2026-09-30")).toMatchObject({ count: 30, achieved: true, pct: 100 });
    delete logs.reading["2026-09-12"];
    expect(goalProgress(goal, logs, "2026-09-30")).toMatchObject({ count: 29, achieved: false });
  });
  it("only counts the linked habit from the start through today", () => {
    const logs: Logs = { reading: { "2026-08-31": { done: true }, "2026-09-01": { done: true }, "2026-09-03": { done: true } }, gym: { "2026-09-02": { done: true } } };
    expect(goalProgress(goal, logs, "2026-09-02").count).toBe(1);
  });
  it("requires calendar-day continuity for consecutive goals, retaining earned achievement", () => {
    const logs: Logs = { reading: { "2026-09-01": { done: true }, "2026-09-02": { done: true }, "2026-09-04": { done: true } } };
    expect(goalProgress({ ...goal, mode: "consecutive", targetDays: 3 }, logs, "2026-09-04")).toMatchObject({ count: 1, best: 2, achieved: false });
    expect(goalProgress({ ...goal, mode: "consecutive", targetDays: 2 }, logs, "2026-09-07").achieved).toBe(true);
  });
  it("restores older saved histories with empty goals", () => {
    expect(parseHabitData('{"version":1}')?.goals).toEqual([]);
  });
  it("ignores demonstration check-ins for personal goals", () => {
    expect(goalProgress(goal, { reading: { "2026-09-01": { done: true, sample: true }, "2026-09-02": { done: true } } }, "2026-09-30").count).toBe(1);
  });
});