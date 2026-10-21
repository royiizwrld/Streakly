import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HabitsProvider, useHabits } from "@/context/HabitsContext";
import { goalProgress } from "@/lib/habits/goals";
import { todayKey } from "@/lib/habits/dates";
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
function mount(sample = false) {
  localStorage.setItem(
    "habit-tracker-data-v1",
    JSON.stringify({
      version: 1,
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
    }),
  );
  render(
    <HabitsProvider>
      <Probe />
    </HabitsProvider>,
  );
}
describe("Goal completion", () => {
  it("ticks the linked habit once and undo restores both habit and goal", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Check in 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("1");
    expect(screen.getByTestId("habit")).toHaveTextContent("true");
    fireEvent.click(screen.getByRole("button", { name: "Undo 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
    expect(screen.getByTestId("habit")).toHaveTextContent("false");
  });
  it("replaces demonstration completion with one real check-in", () => {
    mount(true);
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: "Check in 30 days of daily reading" }));
    expect(screen.getByTestId("progress")).toHaveTextContent("1");
    const saved = JSON.parse(localStorage.getItem("habit-tracker-data-v1") ?? "{}");
    expect(saved.logs.r[todayKey()]).toEqual({ done: true });
  });
});
