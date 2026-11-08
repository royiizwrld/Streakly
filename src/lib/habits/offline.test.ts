import { describe, expect, it } from "vitest";
import { computeDiff } from "./cloud";
import { diffToOutbox, isPermanentError, replayOutbox, type Op, type OutboxItem } from "./offline";
import { emptyData } from "./seed";
import type { HabitData } from "./types";

const habit = { id: "h1", name: "Read", icon: "📚", color: "c", categoryId: "reading", routineId: null, frequency: { type: "daily" as const }, archived: false, createdAt: "2026-01-01" };
const base = (): HabitData => ({ ...emptyData(), habits: [habit] });
const items = (n: number): OutboxItem[] => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, createdAt: i, attempts: 0, op: { kind: "upsert", table: "habit_logs", rows: [{ i }] } }));

describe("offline outbox", () => {
  it("queues a check-in as one idempotent upsert with timestamp and zero attempts", () => {
    const next = base();
    next.logs = { h1: { "2026-02-01": { done: true } } };
    const out = diffToOutbox("u", computeDiff(base(), next));
    expect(out).toHaveLength(1);
    expect(out[0].op).toEqual({ kind: "upsert", table: "habit_logs", rows: [{ user_id: "u", habit_id: "h1", day: "2026-02-01", note: null }] });
    expect(out[0].attempts).toBe(0);
    expect(typeof out[0].createdAt).toBe("number");
  });

  it("clears each item once confirmed, in order", async () => {
    const seen: Op[] = [];
    const res = await replayOutbox({} as never, items(3), () => {}, async (op) => { seen.push(op); });
    expect(res.synced).toBe(3);
    expect(res.remaining).toEqual([]);
    expect(seen.map((o) => (o as { rows: { i: number }[] }).rows[0].i)).toEqual([0, 1, 2]);
  });

  it("keeps the failed item and everything after it when offline, adding a retry count", async () => {
    let calls = 0;
    const res = await replayOutbox({} as never, items(3), () => {}, async () => { calls += 1; if (calls === 2) throw new TypeError("Failed to fetch"); });
    expect(res.synced).toBe(1);
    expect(res.blocked).toBe(true);
    expect(res.remaining.map((x) => x.id)).toEqual(["i1", "i2"]);
    expect(res.remaining[0].attempts).toBe(1);
  });

  it("drops a permanently failing item (missing parent row) without blocking the rest", async () => {
    let calls = 0;
    const res = await replayOutbox({} as never, items(3), () => {}, async () => { calls += 1; if (calls === 1) throw { code: "23503", message: "fk" }; });
    expect(res.dropped.map((x) => x.id)).toEqual(["i0"]);
    expect(res.synced).toBe(2);
    expect(res.remaining).toEqual([]);
  });

  it("treats network and expired-token errors as retryable", () => {
    expect(isPermanentError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isPermanentError({ code: "PGRST301" })).toBe(false);
    expect(isPermanentError({ code: "42501" })).toBe(true);
  });
});
