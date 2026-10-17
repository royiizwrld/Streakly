import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHabits } from "@/context/HabitsContext";
import { dayProgress, isDone, isDue } from "@/lib/habits/logic";
import { formatLong, todayKey } from "@/lib/habits/dates";
import { Heatmap, MonthSelector } from "@/components/Heatmap";
import { FilterBar, NO_FILTER, applyFilters, type Filters } from "@/components/FilterBar";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Streakly" },
      { name: "description", content: "Monthly heatmap of your habit completion history." },
      { property: "og:title", content: "History — Streakly" },
      { property: "og:description", content: "Monthly heatmap of your habit completion history." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const h = useHabits();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  const [selected, setSelected] = useState(todayKey());
  const habits = applyFilters(h.activeHabits, filters);
  const logs = h.data.logs;

  const due = habits.filter((x) => isDue(x, logs, selected));
  const p = dayProgress(habits, logs, selected);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">History</h1>
          <p className="text-sm text-muted-foreground">Share of due habits completed each day</p>
        </div>
        <FilterBar value={filters} onChange={setFilters} />
      </div>
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex justify-end">
            <MonthSelector month={month} onChange={setMonth} />
          </div>
          <Heatmap month={month} value={(k) => dayProgress(habits, logs, k).pct} onSelect={setSelected} />
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-lg font-bold">{formatLong(selected)}</h2>
          <p className="text-sm text-muted-foreground">
            {p.due ? `${p.done} of ${p.due} done (${Math.round((p.pct ?? 0) * 100)}%)` : "Nothing was due."}
          </p>
          <ul className="mt-3 space-y-1.5">
            {due.map((x) => {
              const done = isDone(logs, x.id, selected);
              return (
                <li key={x.id} className="flex items-center gap-2 text-sm">
                  <span>{x.icon}</span>
                  <span className={done ? "font-medium" : "text-muted-foreground"}>{x.name}</span>
                  <span className={`ml-auto text-xs font-semibold ${done ? "text-success" : "text-muted-foreground"}`}>
                    {done ? "Done" : "Missed"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
