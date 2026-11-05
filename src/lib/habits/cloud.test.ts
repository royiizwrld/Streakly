import { describe, expect, it } from "vitest";
import { computeDiff, diffIsEmpty } from "./cloud";
import { emptyData } from "./seed";
import type { HabitData } from "./types";

const habit = { id: "h1", name: "Read", icon: "📚", color: "x", categoryId: "reading", routineId: null, frequency: { type: "daily" as const }, archived: false, createdAt: "2026-01-01" };

describe("cloud sync diff", () => {
  it("saves a new check-in and removes an undone one", () => {
    const a: HabitData = { ...emptyData(), habits: [habit], logs: { h1: { "2026-01-02": { done: true } } } };
    const b: HabitData = { ...a, logs: { h1: { "2026-01-03": { done: true } } } };
    const d = computeDiff(a, b);
    expect(d.logsUpsert).toEqual([{ habit_id: "h1", day: "2026-01-03", note: null }]);
    expect(d.logsRemove.map((l) => l.day)).toEqual(["2026-01-02"]);
  });

  it("never uploads sample habits or sample check-ins", () => {
    const a = emptyData();
    const b: HabitData = { ...a, habits: [{ ...habit, sample: true }], logs: { h1: { "2026-01-02": { done: true, sample: true } } } };
    expect(diffIsEmpty(computeDiff(a, b))).toBe(true);
  });

  it("detects nothing to save when unchanged", () => {
    const a: HabitData = { ...emptyData(), habits: [habit] };
    expect(diffIsEmpty(computeDiff(a, structuredClone(a)))).toBe(true);
  });
});
