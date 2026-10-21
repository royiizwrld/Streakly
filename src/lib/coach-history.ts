import type { UIMessage } from "ai";
import { readStored, writeStored, removeStored } from "./browser-storage";
export type CoachThread = { id: string; title: string; updatedAt: string; messages: UIMessage[] };
export const THREADS_KEY = "ht-coach-threads";
let threads: CoachThread[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const publish = (next: CoachThread[]) => {
  threads = next;
  writeStored(THREADS_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn());
};
export const subscribeThreads = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const getThreads = () => threads;
const empty: CoachThread[] = [];
export const getServerThreads = () => empty;
export function loadThreads() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(readStored(THREADS_KEY) ?? "[]");
    if (Array.isArray(saved))
      threads = saved.filter(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.title === "string" &&
          Array.isArray(t.messages) &&
          t.messages.every(
            (m: UIMessage) =>
              m &&
              typeof m.id === "string" &&
              ["user", "assistant", "system"].includes(m.role) &&
              Array.isArray(m.parts),
          ),
      );
    if (readStored(THREADS_KEY) === null && !threads.length) {
      const legacy = JSON.parse(readStored("ht-coach-chat") ?? "[]");
      if (Array.isArray(legacy) && legacy.length)
        threads = [
          {
            id: crypto.randomUUID(),
            title: "Previous conversation",
            updatedAt: new Date().toISOString(),
            messages: legacy,
          },
        ];
    }
  } catch {
    /* Keep the in-memory chat usable. */
  }
  publish(threads);
  if (readStored(THREADS_KEY) !== null) removeStored("ht-coach-chat");
}
export function createThread(id: string = crypto.randomUUID()) {
  loadThreads();
  const existing = threads.find((t) => t.id === id);
  if (existing) return existing;
  const thread: CoachThread = {
    id,
    title: "New conversation",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  publish([thread, ...threads]);
  return thread;
}
export function saveThread(id: string, messages: UIMessage[]) {
  const text = messages.find((m) => m.role === "user")?.parts.find((p) => p.type === "text");
  publish(
    threads.map((t) =>
      t.id === id
        ? {
            ...t,
            messages,
            title: text?.type === "text" ? text.text.slice(0, 70) : "New conversation",
            updatedAt: new Date().toISOString(),
          }
        : t,
    ),
  );
}
export function deleteThread(id: string) {
  publish(threads.filter((t) => t.id !== id));
}
