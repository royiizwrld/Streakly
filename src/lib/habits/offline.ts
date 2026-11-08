import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readStored, removeStored, writeStored } from "@/lib/browser-storage";
import type { computeDiff } from "./cloud";
import type { HabitData } from "./types";

type Client = SupabaseClient<Database>;
type Table = "habit_categories" | "habit_routines" | "habits" | "habit_goals" | "habit_logs" | "habit_celebrations";
type Diff = ReturnType<typeof computeDiff>;

/** One idempotent database write. Upserts and deletes can be replayed safely any number of times. */
export type Op =
  | { kind: "upsert"; table: Table; rows: Record<string, unknown>[] }
  | { kind: "delete"; table: Table; eq: Record<string, string>; inIds?: { column: string; values: string[] } };

export interface OutboxItem {
  id: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
  op: Op;
}

const CACHE_VERSION = 1;
const cacheKey = (userId: string) => `ht-cache-v${CACHE_VERSION}-${userId}`;
const outboxKey = (userId: string) => `ht-outbox-v${CACHE_VERSION}-${userId}`;

export interface CachedState {
  /** What the UI shows, including changes not yet confirmed by the database. */
  data: HabitData;
  /** The state already turned into outbox items; new changes are diffed against it. */
  base: HabitData;
}

export function readCache(userId: string): CachedState | null {
  const raw = readStored(cacheKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedState;
    if (!parsed?.data?.habits || !parsed?.base?.habits) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(userId: string, state: CachedState) {
  writeStored(cacheKey(userId), JSON.stringify(state));
}

export function readOutbox(userId: string): OutboxItem[] {
  const raw = readStored(outboxKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxItem[]).filter((x) => x && x.op) : [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId: string, items: OutboxItem[]) {
  if (items.length) writeStored(outboxKey(userId), JSON.stringify(items));
  else removeStored(outboxKey(userId));
}

export function clearOfflineState(userId: string) {
  removeStored(cacheKey(userId));
  removeStored(outboxKey(userId));
}

let seq = 0;
function makeItem(op: Op): OutboxItem {
  seq += 1;
  return { id: `${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), attempts: 0, op };
}

/** Turns a snapshot diff into ordered outbox items: parents are written before children, children deleted before parents. */
export function diffToOutbox(userId: string, d: Diff): OutboxItem[] {
  const user_id = userId;
  const ops: Op[] = [];
  const up = (table: Table, rows: Record<string, unknown>[]) => { if (rows.length) ops.push({ kind: "upsert", table, rows }); };
  const now = new Date().toISOString();
  up("habit_categories", d.categories.upsert.map((c) => ({ user_id, id: c.id, name: c.name, built_in: c.builtIn })));
  up("habit_routines", d.routines.upsert.map((r) => ({ user_id, id: r.id, name: r.name, icon: r.icon })));
  up("habits", d.habits.upsert.map((h) => ({
    user_id, id: h.id, name: h.name, icon: h.icon, color: h.color, category_id: h.categoryId, routine_id: h.routineId,
    frequency: h.frequency, reminder: h.reminder ?? null, archived: h.archived, created_on: h.createdAt, updated_at: now,
  })));
  up("habit_goals", d.goals.upsert.map((g) => ({ user_id, id: g.id, name: g.name, habit_id: g.habitId, target_days: g.targetDays, start_date: g.startDate, mode: g.mode })));
  for (let i = 0; i < d.logsUpsert.length; i += 500) up("habit_logs", d.logsUpsert.slice(i, i + 500).map((l) => ({ user_id, ...l })));
  up("habit_celebrations", d.celebrated.map((day) => ({ user_id, day })));
  for (const l of d.logsRemove) ops.push({ kind: "delete", table: "habit_logs", eq: { user_id, habit_id: l.habit_id, day: l.day } });
  if (d.goals.remove.length) ops.push({ kind: "delete", table: "habit_goals", eq: { user_id }, inIds: { column: "id", values: d.goals.remove } });
  if (d.habits.remove.length) {
    ops.push({ kind: "delete", table: "habit_logs", eq: { user_id }, inIds: { column: "habit_id", values: d.habits.remove } });
    ops.push({ kind: "delete", table: "habit_goals", eq: { user_id }, inIds: { column: "habit_id", values: d.habits.remove } });
    ops.push({ kind: "delete", table: "habits", eq: { user_id }, inIds: { column: "id", values: d.habits.remove } });
  }
  if (d.routines.remove.length) ops.push({ kind: "delete", table: "habit_routines", eq: { user_id }, inIds: { column: "id", values: d.routines.remove } });
  if (d.categories.remove.length) ops.push({ kind: "delete", table: "habit_categories", eq: { user_id }, inIds: { column: "id", values: d.categories.remove } });
  return ops.map(makeItem);
}

export async function execOp(sb: Client, op: Op) {
  // The table name is dynamic, so the typed builder can't narrow row shapes here.
  const t = sb.from(op.table as never) as unknown as {
    upsert: (rows: unknown) => PromiseLike<{ error: unknown }>;
    delete: () => { eq: (c: string, v: string) => unknown; in: (c: string, v: string[]) => unknown } & PromiseLike<{ error: unknown }>;
  };
  let res: { error: unknown };
  if (op.kind === "upsert") res = await t.upsert(op.rows);
  else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = t.delete();
    for (const [c, v] of Object.entries(op.eq)) q = q.eq(c, v);
    if (op.inIds) q = q.in(op.inIds.column, op.inIds.values);
    res = await q;
  }
  if (res.error) throw res.error;
}

/**
 * Permanent errors will fail the same way on every retry (missing parent row, invalid data, permission denied),
 * so the item is dropped. Anything else — offline, timeouts, server hiccups, expired tokens — is retried later.
 */
export function isPermanentError(err: unknown): boolean {
  const e = err as { code?: unknown; status?: unknown } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  if (/^PGRST3/.test(code)) return false; // auth/JWT — retry after token refresh
  if (/^(22|23|42)/.test(code) || /^PGRST[12]/.test(code)) return true;
  const status = typeof e?.status === "number" ? e.status : 0;
  return status === 400 || status === 404 || status === 409 || status === 422;
}

export interface ReplayResult { synced: number; dropped: OutboxItem[]; remaining: OutboxItem[]; blocked: boolean }

/** Sends queued items one at a time. Stops at the first retryable failure so order is preserved. */
export async function replayOutbox(
  sb: Client,
  items: OutboxItem[],
  persist: (remaining: OutboxItem[]) => void,
  run: (op: Op) => Promise<void> = (op) => execOp(sb, op),
): Promise<ReplayResult> {
  let queue = [...items];
  let synced = 0;
  const dropped: OutboxItem[] = [];
  while (queue.length) {
    const [item, ...rest] = queue;
    try {
      await run(item.op);
      synced += 1;
      queue = rest;
      persist(queue);
    } catch (err) {
      if (isPermanentError(err)) {
        dropped.push(item);
        queue = rest;
        persist(queue);
        continue;
      }
      queue = [{ ...item, attempts: item.attempts + 1, lastError: String((err as { message?: string })?.message ?? err) }, ...rest];
      persist(queue);
      return { synced, dropped, remaining: queue, blocked: true };
    }
  }
  return { synced, dropped, remaining: [], blocked: false };
}
