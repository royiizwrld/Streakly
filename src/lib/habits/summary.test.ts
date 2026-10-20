import { describe, expect, it } from "vitest";
import { emptyData } from "./seed";
import { buildCoachSummary } from "./summary";
import { parseHabitData } from "./storage";
import type { HabitData } from "./types";

const data = (): HabitData => ({ ...emptyData(), habits: [{ id: "read", name: "Daily reading", icon: "📖", color: "var(--primary)", categoryId: "reading", routineId: "evening", frequency: { type: "daily" }, archived: false, createdAt: "2026-10-01", sample: true, sampleHistoryTagged: true }], logs: { read: { "2026-10-01": { done: true, sample: true }, "2026-10-02": { done: true, sample: true } } } });
describe("Personal coach history", () => {
  it("never presents demonstration check-ins as personal history", () => {
    expect(buildCoachSummary(data(), "2026-10-20")).toMatchObject({ hasUserHistory: false, habitCount: 0, excludedSampleCheckIns: 2 });
  });
  it("includes fresh real check-ins on a retained sample habit and linked goals", () => {
    const d = data();
    d.logs.read["2026-10-20"] = { done: true, note: "Read my own book" };
    d.goals = [{ id: "g", habitId: "read", name: "30 days of daily reading", targetDays: 30, startDate: "2026-10-01", mode: "total" }];
    const summary = buildCoachSummary(d, "2026-10-20");
    expect(summary).toMatchObject({ hasUserHistory: true, asOf: "2026-10-20" });
    expect(summary.habits[0]).toMatchObject({ totalCheckIns: 1, trackingSince: "2026-10-20", currentStreak: "1 days", recentNotes: ["2026-10-20: Read my own book"] });
    expect(summary.goals[0]).toMatchObject({ count: 1, targetDays: 30 });
    delete d.logs.read["2026-10-20"];
    expect(buildCoachSummary(d, "2026-10-20").hasUserHistory).toBe(false);
  });
  it("labels old sample entries once while later check-ins remain personal", () => {
    const d = data();
    delete d.habits[0].sampleHistoryTagged;
    delete d.logs.read["2026-10-01"].sample;
    const migrated = parseHabitData(JSON.stringify(d));
    expect(migrated?.logs.read["2026-10-01"].sample).toBe(true);
    if (!migrated) throw new Error("Migration failed");
    migrated.logs.read["2026-10-20"] = { done: true };
    expect(parseHabitData(JSON.stringify(migrated))?.logs.read["2026-10-20"].sample).toBeUndefined();
  });
  it("does not call unscheduled dates missed or weekly opportunities failures", () => {
    const d = data();
    d.habits[0] = { ...d.habits[0], sample: false, frequency: { type: "weekdays", days: [1, 3, 5] } };
    expect(buildCoachSummary(d, "2026-10-20").habits[0].last14days).toContain("-");
    d.habits[0].frequency = { type: "weekly", times: 3 };
    expect(buildCoachSummary(d, "2026-10-20").habits[0].weekdayMetric).toBe("check-in distribution, not missed days");
  });
});