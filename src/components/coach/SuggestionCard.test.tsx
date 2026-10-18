import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SuggestionCard } from "./SuggestionCard";

const mocks = vi.hoisted(() => ({ addRoutine: vi.fn(() => ({ id: "evening" })), updateHabit: vi.fn() }));
vi.mock("@/context/HabitsContext", () => ({
  useHabits: () => ({
    getHabit: () => ({ id: "water", name: "Water", icon: "💧", frequency: { type: "daily" } }),
    data: { routines: [] }, ...mocks,
  }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

it("creates a suggested routine only after confirmation", () => {
  render(<SuggestionCard id="suggestion" change={{ habitId: "water", action: "move_routine", routine: "Evening", label: "Move to Evening", timesPerWeek: null, weekdays: null, newName: null }} />);
  expect(mocks.addRoutine).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(mocks.addRoutine).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /^Confirm$/ }));
  expect(mocks.addRoutine).toHaveBeenCalledWith("Evening", "🕐");
  expect(mocks.updateHabit).toHaveBeenCalledWith("water", { routineId: "evening" });
});