import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "light" | "dark" | "system";

export const PALETTES = [
  { id: "sunrise", name: "Sunrise", hue: 35, chroma: 0.16 },
  { id: "ocean", name: "Ocean", hue: 235, chroma: 0.15 },
  { id: "forest", name: "Forest", hue: 150, chroma: 0.13 },
  { id: "citrus", name: "Citrus", hue: 110, chroma: 0.16 },
  { id: "rose", name: "Rose", hue: 10, chroma: 0.17 },
  { id: "lagoon", name: "Lagoon", hue: 195, chroma: 0.12 },
  { id: "plum", name: "Plum", hue: 320, chroma: 0.15 },
  { id: "ember", name: "Ember", hue: 55, chroma: 0.17 },
  { id: "glacier", name: "Glacier", hue: 260, chroma: 0.11 },
  { id: "graphite", name: "Graphite", hue: 250, chroma: 0.02 },
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
