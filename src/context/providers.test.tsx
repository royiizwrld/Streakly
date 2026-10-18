import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HabitsProvider, useHabits } from "./HabitsContext";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Controls() {
  const habits = useHabits();
  const theme = useTheme();
  return <>
    <output data-testid="ready">{String(habits.ready)}</output>
    <output data-testid="count">{habits.activeHabits.length}</output>
    <output data-testid="theme">{theme.resolved}/{theme.palette}</output>
    <button onClick={() => theme.setMode("dark")}>Dark</button>
    <button onClick={() => theme.setPalette("ocean")}>Ocean</button>
    <button onClick={() => habits.addHabit({ name: "Test", icon: "💧", color: "var(--primary)", categoryId: "health", routineId: null, frequency: { type: "daily" } })}>Add</button>
  </>;
}
const mount = () => render(<ThemeProvider><HabitsProvider><Controls /></HabitsProvider></ThemeProvider>);

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("App startup and controls", () => {
  it("loads Today data and allows themes and habits when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    mount();
    expect(screen.getByTestId("ready")).toHaveTextContent("true");
    const count = Number(screen.getByTestId("count").textContent);
    fireEvent.click(screen.getByText("Dark"));
    fireEvent.click(screen.getByText("Ocean"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark/ocean");
    fireEvent.click(screen.getByText("Add"));
    expect(Number(screen.getByTestId("count").textContent)).toBe(count + 1);
  });

  it("restores saved light mode and forest palette", () => {
    localStorage.setItem("ht-mode", "light");
    localStorage.setItem("ht-palette", "forest");
    mount();
    expect(screen.getByTestId("theme")).toHaveTextContent("light/forest");
    fireEvent.click(screen.getByText("Dark"));
    expect(localStorage.getItem("ht-mode")).toBe("dark");
  });

  it("recovers missing data fields instead of crashing startup", () => {
    localStorage.setItem("habit-tracker-data-v1", '{"version":1}');
    mount();
    expect(screen.getByTestId("ready")).toHaveTextContent("true");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    fireEvent.click(screen.getByText("Add"));
    expect(JSON.parse(localStorage.getItem("habit-tracker-data-v1") ?? "{}").habits).toHaveLength(1);
  });

  it("does not overwrite malformed saved history", () => {
    const raw = '{"version":1,"habits":null}';
    localStorage.setItem("habit-tracker-data-v1", raw);
    mount();
    expect(screen.getByTestId("ready")).toHaveTextContent("true");
    expect(localStorage.getItem("habit-tracker-data-v1")).toBe(raw);
  });
});