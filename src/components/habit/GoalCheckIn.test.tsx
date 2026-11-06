import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HabitData } from "@/lib/habits/types";

const cloud = vi.hoisted(() => ({ initial: null as HabitData | null, pushed: [] as unknown[] }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/habits/cloud", async (orig) => {
  const real = await orig<typeof import("@/lib/habits/cloud")>();
  return {
    ...real,
    loadCloudData: async () => ({ data: structuredClone(cloud.initial!), snapshot: structuredClone(cloud.initial!) }),
    pushDiff: async (_sb: unknown, _u: string, d: unknown) => { cloud.pushed.push(d); },
  };
});
import { HabitsProvider, useHabits } from "@/context/HabitsContext";
import { goalProgress } from "@/lib/habits/goals";
import { todayKey } from "@/lib/habits/dates";
import { emptyData } from "@/lib/habits/seed";
import { GoalCheckIn } from "./GoalCheckIn";
const goal = {
  id: "g",
  habitId: "r",
  name: "30 days of daily reading",
  targetDays: 30,
  startDate: "2026-01-01",
  mode: "total" as const,
};
function Probe() {
  const h = useHabits();
  return (
    <>
      <GoalCheckIn goal={goal} />
      <output data-testid="progress">{goalProgress(goal, h.data.logs).count}</output>
      <output data-testid="habit">{String(h.isDone("r", todayKey()))}</output>
    </>
  );
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);
async function mount(sample = false) {
  cloud.pushed = [];
  cloud.initial = {
      ...emptyData(),
      habits: [
        {
          id: "r",
          name: "Reading",
          icon: "📚",
          color: "var(--primary)",
          categoryId: "reading",
          routineId: null,
          frequency: { type: "daily" },
          archived: false,
          createdAt: "2026-01-01",
        },
      ],
      goals: [goal],
      logs: sample ? { r: { [todayKey()]: { done: true, sample: true } } } : {},
  } as HabitData;
  render(
    <HabitsProvider>
      <Probe />
    </HabitsProvider>,
  );
  await screen.findByRole("button", { name: /30 days of daily reading/ });
}
describe("Goal completion", () => {
  it("ticks the linked habit once and undo restores both habit and goal", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Check in 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("1");
    expect(screen.getByTestId("habit")).toHaveTextContent("true");
    fireEvent.click(screen.getByRole("button", { name: "Undo 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
    expect(screen.getByTestId("habit")).toHaveTextContent("false");
  });
  it("replaces demonstration completion with one real check-in and saves it to the account", async () => {
    await mount(true);
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: "Check in 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("1");
    await waitFor(() => expect(cloud.pushed.length).toBe(1), { timeout: 2000 });
    expect((cloud.pushed[0] as { logsUpsert: unknown[] }).logsUpsert).toEqual([{ habit_id: "r", day: todayKey(), note: null }]);
  });
});
