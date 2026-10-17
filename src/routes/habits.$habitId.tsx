import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Flame, Pencil, Trophy } from "lucide-react";
import { useHabits } from "@/context/HabitsContext";
import { describeFrequency, isScheduled } from "@/lib/habits/logic";
import { formatLong, todayKey } from "@/lib/habits/dates";
import { Heatmap, MonthSelector } from "@/components/Heatmap";
import { HabitFormDialog } from "@/components/habit/HabitFormDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/habits/$habitId")({
  head: () => ({
    meta: [
      { title: "Habit details — Streakly" },
      { name: "description", content: "Streaks, 30-day completion rate, calendar and notes for one habit." },
      { property: "og:title", content: "Habit details — Streakly" },
      { property: "og:description", content: "Streaks, 30-day completion rate, calendar and notes for one habit." },
    ],
  }),
  component: HabitDetail,
});

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function HabitDetail() {
  const { habitId } = Route.useParams();
  const h = useHabits();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [editOpen, setEditOpen] = useState(false);
  const habit = h.getHabit(habitId);

  if (!h.ready) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  if (!habit)
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl font-bold">Habit not found</p>
        <Link to="/habits" className="mt-3 inline-block text-primary underline">
          Back to habits
        </Link>
      </div>
    );

  const s = h.streak(habit);
  const rate = h.rate30(habit);
  const logs = h.data.logs[habit.id] ?? {};
  const history = Object.entries(logs).sort(([a], [b]) => b.localeCompare(a));
  const today = todayKey();

  return (
    <div className="space-y-6">
      <Link to="/habits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Habits
      </Link>
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl text-4xl" style={{ background: `color-mix(in oklch, ${habit.color} 22%, transparent)` }}>
          {habit.icon}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{habit.name}</h1>
          <p className="text-sm text-muted-foreground">
            {describeFrequency(habit.frequency)} · {h.categoryName(habit.categoryId)} · {h.routineName(habit.routineId)}
            {habit.reminder ? ` · ⏰ ${habit.reminder}` : ""}
            {habit.archived ? " · Archived" : ""}
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Edit habit" onClick={() => setEditOpen(true)}>
          <Pencil />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Current streak" value={`${s.current} ${s.unit === "weeks" ? "wk" : "d"}`} icon={<Flame className="size-3.5 text-primary" />} />
        <Stat label="Longest streak" value={`${s.longest} ${s.unit === "weeks" ? "wk" : "d"}`} icon={<Trophy className="size-3.5 text-primary" />} />
        <Stat label="Last 30 days" value={rate == null ? "—" : `${Math.round(rate * 100)}%`} />
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Calendar</h2>
          <MonthSelector month={month} onChange={setMonth} />
        </div>
        <Heatmap
          month={month}
          color={habit.color}
          value={(k) => (logs[k] ? 1 : k >= habit.createdAt && k <= today && isScheduled(habit, k) && habit.frequency.type !== "weekly" ? 0 : null)}
          onSelect={(k) => h.toggle(habit.id, k)}
        />
        <p className="mt-2 text-xs text-muted-foreground">Tap a day to toggle a check-in.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {history.slice(0, 60).map(([k, e]) => (
              <li key={k} className="flex gap-3 px-4 py-3 text-sm">
                <span className="mt-0.5 size-2.5 shrink-0 rounded-full" style={{ background: habit.color }} />
                <div>
                  <p className="font-medium">{formatLong(k)}</p>
                  {e.note && <p className="text-muted-foreground">“{e.note}”</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <HabitFormDialog open={editOpen} onOpenChange={setEditOpen} habit={habit} />
    </div>
  );
}
