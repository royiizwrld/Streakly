import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Controls() {
  const theme = useTheme();
  return <>
    <output data-testid="theme">{theme.resolved}/{theme.palette}</output>
    <button onClick={() => theme.setMode("dark")}>Dark</button>
    <button onClick={() => theme.setPalette("ocean")}>Ocean</button>
  </>;
}
const mount = () => render(<ThemeProvider><Controls /></ThemeProvider>);

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Theme controls", () => {
  it("still work when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    mount();
    fireEvent.click(screen.getByText("Dark"));
    fireEvent.click(screen.getByText("Ocean"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark/ocean");
  });

  it("restores saved light mode and forest palette", () => {
    localStorage.setItem("ht-mode", "light");
    localStorage.setItem("ht-palette", "forest");
    mount();
    expect(screen.getByTestId("theme")).toHaveTextContent("light/forest");
    fireEvent.click(screen.getByText("Dark"));
    expect(localStorage.getItem("ht-mode")).toBe("dark");
  });
});
