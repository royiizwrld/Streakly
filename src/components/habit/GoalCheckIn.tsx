import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/context/HabitsContext";
import type { Goal } from "@/lib/habits/types";
import { todayKey } from "@/lib/habits/dates";

export function GoalCheckIn({ goal, dateKey = todayKey() }: { goal: Goal; dateKey?: string }) {
  const h = useHabits();
  const habit = h.getHabit(goal.habitId);
  const done = Boolean(h.data.logs[goal.habitId]?.[dateKey]?.done && !h.data.logs[goal.habitId]?.[dateKey]?.sample);
  return <Button variant={done ? "secondary" : "outline"} className="min-h-11" disabled={!habit || habit.archived || dateKey < goal.startDate || dateKey > todayKey()} aria-label={`${done ? "Undo" : "Check in"} ${goal.name}`} aria-pressed={done} onClick={() => h.checkInGoal(goal.habitId, dateKey)}>
    <span className="grid size-5 place-items-center rounded border border-current">{done && <Check className="size-4" />}</span>
    {done ? "Completed" : "Check in"} {dateKey === todayKey() ? "today" : "this day"}
  </Button>;
}