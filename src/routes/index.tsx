import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PartyPopper, Plus } from "lucide-react";
import { useHabits } from "@/context/HabitsContext";
import { addDays, formatLong, todayKey } from "@/lib/habits/dates";
import { HabitRow } from "@/components/habit/HabitRow";
import { HabitFormDialog } from "@/components/habit/HabitFormDialog";
import { FilterBar, NO_FILTER, applyFilters, type Filters } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fireConfetti } from "@/lib/celebrate";
import type { Habit } from "@/lib/habits/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Streakly Habit Tracker" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Check off today's habits, track routines and keep your streaks alive." },
      { property: "og:title", content: "Today — Streakly Habit Tracker" },
      { property: "og:description", content: "Check off today's habits, track routines and keep your streaks alive." },
    ],
  }),
  component: Today,
});

function ProgressRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-primary-foreground/25" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-primary-foreground transition-[stroke-dashoffset] duration-500"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

function Today() {
  const h = useHabits();
  const today = todayKey();
  const [day, setDay] = useState(today);
  const [view, setView] = useState<"routine" | "category">("routine");
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  const [formOpen, setFormOpen] = useState(false);
  const [congrats, setCongrats] = useState(false);

  const due = useMemo(() => h.activeHabits.filter((x) => h.isDue(x, day)), [h, day]);
  const visible = applyFilters(due, filters);
  const progress = h.dayProgress(day);
  const allDone = progress.due > 0 && progress.done === progress.due;

  // Celebrate once per day when everything due today is checked.
  const prevAllDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (!h.ready || day !== today) return;
    if (prevAllDone.current === false && allDone && !h.data.celebrated.includes(today)) {
      h.markCelebrated(today);
      fireConfetti();
      setCongrats(true);
      const t = setTimeout(() => setCongrats(false), 5000);
      return () => clearTimeout(t);
    }
    prevAllDone.current = allDone;
  }, [allDone, day, today, h]);
  useEffect(() => {
    prevAllDone.current = null;
  }, [day]);
  useEffect(() => {
    if (prevAllDone.current === null && h.ready) prevAllDone.current = allDone;
  });

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Habit[] }>();
    const order =
      view === "routine"
        ? [...h.data.routines.map((r) => ({ id: r.id, label: `${r.icon} ${r.name}` })), { id: "none", label: "🕐 Anytime" }]
        : h.data.categories.map((c) => ({ id: c.id, label: c.name }));
    order.forEach((o) => map.set(o.id, { label: o.label, items: [] }));
    for (const x of visible) {
      const k = view === "routine" ? (x.routineId ?? "none") : x.categoryId;
      if (!map.has(k)) map.set(k, { label: view === "routine" ? "🕐 Anytime" : "Other", items: [] });
      map.get(k)?.items.push(x);
    }
    return [...map.entries()].filter(([, g]) => g.items.length);
  }, [visible, view, h.data.routines, h.data.categories]);

  if (!h.ready) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;

  const pct = progress.pct ?? 0;
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-5 text-primary-foreground shadow-card sm:p-7">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            aria-label="Previous day"
            onClick={() => setDay(addDays(day, -1))}
          >
            <ChevronLeft />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium opacity-85">{day === today ? "Today" : day === addDays(today, -1) ? "Yesterday" : "Editing past day"}</p>
            <h1 className="font-display text-xl font-bold sm:text-2xl">{formatLong(day)}</h1>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            aria-label="Next day"
            disabled={day >= today}
            onClick={() => setDay(addDays(day, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <div className="relative">
            <ProgressRing pct={pct} />
            <span className="absolute inset-0 grid place-items-center text-lg font-bold">{Math.round(pct * 100)}%</span>
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold">
              {progress.done} of {progress.due} done
            </p>
            <p className="text-sm opacity-85">
              {progress.due === 0
                ? "Nothing due — enjoy the rest."
                : allDone
                  ? "Everything checked off. Beautiful work!"
                  : `${progress.due - progress.done} to go — one tap at a time.`}
            </p>
          </div>
        </div>
        {day !== today && (
          <button onClick={() => setDay(today)} className="mt-4 text-sm font-semibold underline underline-offset-4">
            Back to today
          </button>
        )}
      </section>

      {congrats && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-accent-foreground">
          <PartyPopper className="size-6 text-primary" />
          <div>
            <p className="font-semibold">All done for today! 🎉</p>
            <p className="text-sm">You showed up for every habit. That's how streaks are built.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as typeof view)} className="rounded-full bg-muted p-1">
          <ToggleGroupItem value="routine" className="rounded-full px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm">
            By routine
          </ToggleGroupItem>
          <ToggleGroupItem value="category" className="rounded-full px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm">
            By category
          </ToggleGroupItem>
        </ToggleGroup>
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {h.activeHabits.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-xl font-bold">Start your first habit</p>
          <p className="mt-1 text-sm text-muted-foreground">Add one by hand or paste your whole routine.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add habit
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/habits" search={{ bulk: true }}>
                Bulk add with AI
              </Link>
            </Button>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No habits due{filters !== NO_FILTER ? " for this filter" : ""}.</p>
      ) : (
        <div className="space-y-6">
          {groups.map(([id, g]) => {
            const done = g.items.filter((x) => h.isDone(x.id, day)).length;
            return (
              <section key={id} className="space-y-2.5">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="font-display text-base font-bold">{g.label}</h2>
                  <span className="text-xs font-medium text-muted-foreground">
                    {done}/{g.items.length}
                  </span>
                </div>
                {g.items.map((x) => (
                  <HabitRow key={x.id} habit={x} dateKey={day} />
                ))}
              </section>
            );
          })}
        </div>
      )}

      <Button onClick={() => setFormOpen(true)} variant="outline" className="h-12 w-full rounded-2xl border-dashed">
        <Plus /> Add habit
      </Button>
      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
