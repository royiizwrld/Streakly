import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useHabits } from "@/context/HabitsContext";
import { goalProgress } from "@/lib/habits/goals";
import { formatShort } from "@/lib/habits/dates";
import type { Goal } from "@/lib/habits/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GoalFormDialog } from "@/components/habit/GoalFormDialog";
import { GoalCheckIn } from "@/components/habit/GoalCheckIn";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [
    { title: "Goals — Streakly" },
    { name: "description", content: "Set personal habit goals and track progress with your daily check-ins." },
    { property: "og:title", content: "Goals — Streakly" },
    { property: "og:description", content: "Set personal habit goals and track progress with your daily check-ins." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GoalsPage,
});

function GoalsPage() {
  const h = useHabits();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal>();
  const complete = h.data.goals.filter((goal) => goalProgress(goal, h.data.logs).achieved).length;
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="font-display text-3xl font-extrabold">Goals</h1><p className="mt-1 text-sm text-muted-foreground">{h.data.goals.length - complete} in progress · {complete} achieved</p></div>
      <Button disabled={!h.ready || !h.activeHabits.length} onClick={() => { setEditing(undefined); setOpen(true); }}><Plus /> New goal</Button>
    </div>
    {!h.ready ? <p className="text-muted-foreground">Loading goals…</p> : !h.data.goals.length ?
      <div className="flex flex-col items-center gap-3 py-16 text-center"><Target className="size-12 text-primary" /><h2 className="font-display text-xl font-bold">Your next milestone</h2><p className="max-w-sm text-muted-foreground">{h.activeHabits.length ? "30 days of reading. 12 gym sessions. One small step at a time." : "Add a habit to start your first goal."}</p>{!h.activeHabits.length && <Button asChild><Link to="/habits">My habits</Link></Button>}</div> :
      <div className="grid gap-4 sm:grid-cols-2">{h.data.goals.map((goal) => {
        const habit = h.getHabit(goal.habitId);
        const progress = goalProgress(goal, h.data.logs);
        return <article key={goal.id} className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-xl">{progress.achieved ? <Check className="text-success" /> : habit?.icon ?? <Target />}</span><div className="min-w-0 flex-1"><h2 className="break-words font-display text-lg font-bold">{goal.name}</h2>{habit && <Link to="/habits/$habitId" params={{ habitId: habit.id }} className="text-sm text-muted-foreground hover:text-primary">{habit.name}{habit.archived ? " · Archived" : ""}{habit.sample ? " · Sample" : ""}</Link>}</div></div>
          <div><div className="mb-2 flex items-baseline justify-between gap-2"><span className="text-2xl font-bold">{Math.min(progress.count, goal.targetDays)}<span className="text-sm font-normal text-muted-foreground"> / {goal.targetDays} days</span></span><span className={progress.achieved ? "text-sm font-semibold text-success" : "text-sm text-muted-foreground"}>{progress.achieved ? "Achieved" : `${Math.round(progress.pct)}%`}</span></div><Progress value={progress.pct} aria-label={`${goal.name} progress`} /></div>
          <GoalCheckIn goal={goal} />
          <div className="flex items-end justify-between gap-2"><div className="text-xs text-muted-foreground"><p>{goal.mode === "consecutive" ? "Consecutive days" : "Total check-in days"} · Since {formatShort(goal.startDate)}</p>{goal.mode === "consecutive" && <p className="mt-1">Best run: {progress.best} days</p>}</div><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Edit ${goal.name}`} title="Edit goal" onClick={() => { setEditing(goal); setOpen(true); }}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${goal.name}`} title="Delete goal" onClick={() => { if (confirm(`Delete “${goal.name}”? Your habit check-ins will be kept.`)) h.deleteGoal(goal.id); }}><Trash2 /></Button></div></div>
        </article>;
      })}</div>}
    <GoalFormDialog open={open} onOpenChange={setOpen} goal={editing} />
  </div>;
}