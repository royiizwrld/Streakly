import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, CalendarDays, CheckCircle2, ListTodo, Moon, Settings, Sun, Target } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Today", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", icon: ListTodo },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { resolved, setMode } = useTheme();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid size-8 place-items-center rounded-xl bg-hero text-primary-foreground">✓</span>
            Streakly
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full"
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setMode(resolved === "dark" ? "light" : "dark")}
          >
            {resolved === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 md:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <n.icon className="size-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>

      <CoachPanel />
    </div>
  );
}
