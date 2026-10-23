import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame } from "lucide-react";
import { useHabits } from "@/context/HabitsContext";
import { addDays, formatShort, todayKey, weekStart, weekday, WEEKDAY_LONG } from "@/lib/habits/dates";
import { completionRate, computeStreak, dayProgress, weekRate } from "@/lib/habits/logic";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Streakly" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Weekly completion trends, category rates, best days and streak leaderboard." },
      { property: "og:title", content: "Stats — Streakly" },
      { property: "og:description", content: "Weekly completion trends, category rates, best days and streak leaderboard." },
    ],
  }),
  component: StatsPage,
});

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--popover-foreground)",
};

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-5 shadow-card ${className}`}>
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function StatsPage() {
  const h = useHabits();
  const { activeHabits: habits, data } = h;

  const stats = useMemo(() => {
    const today = todayKey();
    const cur = weekStart(today);
    const weekly = Array.from({ length: 12 }, (_, i) => {
      const w = addDays(cur, -7 * (11 - i));
      const r = weekRate(habits, data.logs, w);
      return { week: formatShort(w), rate: r == null ? null : Math.round(r * 100) };
    });
    const byCat = data.categories
      .map((c) => {
        const hs = habits.filter((x) => x.categoryId === c.id);
        const rates = hs.map((x) => completionRate(x, data.logs, 30)).filter((r): r is number => r != null);
        return { name: c.name, rate: rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) : null };
      })
      .filter((c) => c.rate != null);
    const wd = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
    for (let i = 1; i <= 56; i++) {
      const d = addDays(today, -i);
      const p = dayProgress(habits, data.logs, d).pct;
      if (p != null) {
        wd[weekday(d)].sum += p;
        wd[weekday(d)].n++;
      }
    }
    const days = wd
      .map((x, i) => ({ day: WEEKDAY_LONG[i], rate: x.n ? Math.round((x.sum / x.n) * 100) : null }))
      .filter((x): x is { day: string; rate: number } => x.rate != null)
      .sort((a, b) => b.rate - a.rate);
    const leaderboard = habits
      .map((x) => ({ habit: x, s: computeStreak(x, data.logs) }))
      .sort((a, b) => b.s.current - a.s.current || b.s.longest - a.s.longest);
    return { weekly, byCat, days, leaderboard };
  }, [habits, data]);

  if (!h.ready) return <div className="h-64 animate-pulse rounded-3xl bg-muted" />;
  if (!habits.length) return <p className="py-16 text-center text-muted-foreground">Add some habits to see stats.</p>;

  const best = stats.days.slice(0, 2);
  const worst = stats.days.slice(-2).reverse();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Stats</h1>
      <Card title="Weekly completion · last 12 weeks">
        <div className="h-60">
          <ResponsiveContainer>
            <LineChart data={stats.weekly} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Completion"]} />
              <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="By category · last 30 days">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={stats.byCat} margin={{ left: -20 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={56} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v) => [`${v}%`, "Completion"]} />
                <Bar dataKey="rate" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Best & worst days">
          {stats.days.length < 3 ? (
            <p className="text-sm text-muted-foreground">Not enough history yet.</p>
          ) : (
            <div className="space-y-4">
              {[
                ["Strongest", best],
                ["Needs love", worst],
              ].map(([label, list]) => (
                <div key={label as string}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label as string}</p>
                  {(list as typeof best).map((d) => (
                    <div key={d.day} className="mb-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{d.day}</span>
                        <span>{d.rate}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${d.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card title="Streak leaderboard">
        <ol className="space-y-2">
          {stats.leaderboard.map(({ habit, s }, i) => (
            <li key={habit.id}>
              <Link to="/habits/$habitId" params={{ habitId: habit.id }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent">
                <span className="w-6 text-center font-display font-bold text-muted-foreground">{i + 1}</span>
                <span className="text-xl">{habit.icon}</span>
                <span className="flex-1 truncate font-medium">{habit.name}</span>
                <span className="flex items-center gap-1 font-semibold">
                  <Flame className="size-4 text-primary" />
                  {s.current} {s.unit === "weeks" ? "wk" : "d"}
                </span>
                <span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">best {s.longest}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
