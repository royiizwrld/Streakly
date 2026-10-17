import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "light" | "dark" | "system";

export const PALETTES = [
  { id: "sunrise", name: "Sunrise", hue: 35 },
  { id: "ocean", name: "Ocean", hue: 235 },
  { id: "forest", name: "Forest", hue: 150 },
  { id: "citrus", name: "Citrus", hue: 95 },
  { id: "rose", name: "Rose", hue: 10 },
  { id: "lagoon", name: "Lagoon", hue: 195 },
  { id: "plum", name: "Plum", hue: 320 },
  { id: "ember", name: "Ember", hue: 55 },
  { id: "glacier", name: "Glacier", hue: 260 },
  { id: "graphite", name: "Graphite", hue: 250 },
] as const;
export type PaletteId = (typeof PALETTES)[number]["id"];

interface ThemeCtx {
  mode: Mode;
  setMode: (m: Mode) => void;
  palette: PaletteId;
  setPalette: (p: PaletteId) => void;
  resolved: "light" | "dark";
}

const Ctx = createContext<ThemeCtx | null>(null);

/** Inline script placed in <head> so the saved theme applies before paint. */
export const themeBootScript = `(function(){try{var m=localStorage.getItem('ht-mode')||'system';var p=localStorage.getItem('ht-palette')||'sunrise';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.dataset.palette=p;}catch(e){}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("system");
  const [palette, setPaletteState] = useState<PaletteId>("sunrise");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setModeState((localStorage.getItem("ht-mode") as Mode) || "system");
    setPaletteState((localStorage.getItem("ht-palette") as PaletteId) || "sunrise");
    const mq = matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.palette = palette;
  }, [resolved, palette]);

  const setMode = (m: Mode) => {
    localStorage.setItem("ht-mode", m);
    setModeState(m);
  };
  const setPalette = (p: PaletteId) => {
    localStorage.setItem("ht-palette", p);
    setPaletteState(p);
  };

  return <Ctx.Provider value={{ mode, setMode, palette, setPalette, resolved }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
