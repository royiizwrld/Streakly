import { beforeEach, describe, expect, it, vi } from "vitest";
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});
describe("Coach history", () => {
  it("restores distinct conversations without messages bleeding across threads", async () => {
    const history = await import("./coach-history");
    history.createThread("first");
    history.createThread("second");
    history.saveThread("first", [
      { id: "m1", role: "user", parts: [{ type: "text", text: "Review my reading" }] },
    ]);
    history.saveThread("second", [
      { id: "m2", role: "user", parts: [{ type: "text", text: "Review my gym" }] },
    ]);
    vi.resetModules();
    const restored = await import("./coach-history");
    restored.loadThreads();
    restored.loadThreads();
    expect(restored.getThreads()).toHaveLength(2);
    expect(restored.getThreads().find((t) => t.id === "first")?.messages[0].id).toBe("m1");
    expect(restored.getThreads().find((t) => t.id === "second")?.messages[0].id).toBe("m2");
  });
  it("keeps history controls usable when storage is blocked", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    const history = await import("./coach-history");
    history.createThread("one");
    expect(history.getThreads()).toHaveLength(1);
    history.deleteThread("one");
    expect(history.getThreads()).toHaveLength(0);
    spy.mockRestore();
  });
});
