import { useEffect, useState } from "react";
import { Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import type { Habit } from "@/lib/habits/types";
import { describeFrequency } from "@/lib/habits/logic";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface ProposedChange {
  habitId: string;
  action: "set_weekly_target" | "set_weekdays" | "set_daily" | "move_routine" | "rename";
  timesPerWeek: number | null;
  weekdays: number[] | null;
  routine: string | null;
  newName: string | null;
  label: string;
}

const APPLIED_KEY = "ht-coach-applied";

function readApplied(): string[] {
  try {
    return JSON.parse(localStorage.getItem(APPLIED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function SuggestionCard({ id, change }: { id: string; change: ProposedChange }) {
  const { getHabit, updateHabit, data, addRoutine } = useHabits();
  const [applied, setApplied] = useState(false);
  useEffect(() => setApplied(readApplied().includes(id)), [id]);
  const habit = getHabit(change.habitId);

  if (!habit) return null;

  const patch = (): Partial<Habit> | null => {
    switch (change.action) {
      case "set_daily":
        return { frequency: { type: "daily" } };
      case "set_weekly_target":
        return change.timesPerWeek ? { frequency: { type: "weekly", times: change.timesPerWeek } } : null;
      case "set_weekdays":
        return change.weekdays?.length ? { frequency: { type: "weekdays", days: change.weekdays } } : null;
      case "rename":
        return change.newName?.trim() ? { name: change.newName.trim().slice(0, 80) } : null;
      case "move_routine": {
        if (!change.routine) return null;
        const r = data.routines.find((x) => x.name.toLowerCase() === change.routine!.toLowerCase());
        return { routineId: (r ?? addRoutine(change.routine, "🕐")).id };
      }
    }
  };

  const describe = () => {
    const p = patch();
    if (!p) return "This suggestion is incomplete and can't be applied.";
    if (p.frequency) return `${habit.name}: ${describeFrequency(habit.frequency)} → ${describeFrequency(p.frequency)}`;
    if (p.name) return `Rename "${habit.name}" → "${p.name}"`;
    return `Move "${habit.name}" to the ${change.routine} routine`;
  };

  const apply = () => {
    const p = patch();
    if (!p) return toast.error("This suggestion can't be applied.");
    updateHabit(habit.id, p);
    localStorage.setItem(APPLIED_KEY, JSON.stringify([...readApplied(), id].slice(-200)));
    setApplied(true);
    toast.success("Change applied");
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent/50 p-3">
      <span className="text-xl">{habit.icon}</span>
      <p className="flex-1 text-sm font-medium">{change.label}</p>
      {applied ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <Check className="size-4" /> Applied
        </span>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="rounded-full">
              <Wand2 /> Apply
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apply this change?</AlertDialogTitle>
              <AlertDialogDescription>{describe()}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not now</AlertDialogCancel>
              <AlertDialogAction onClick={apply}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
