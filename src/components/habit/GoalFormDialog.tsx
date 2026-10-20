import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import { todayKey } from "@/lib/habits/dates";
import type { Goal } from "@/lib/habits/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function GoalFormDialog({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (open: boolean) => void; goal?: Goal }) {
  const h = useHabits();
  const [name, setName] = useState("");
  const [habitId, setHabitId] = useState("");
  const [target, setTarget] = useState("30");
  const [startDate, setStartDate] = useState(todayKey());
  const [mode, setMode] = useState<Goal["mode"]>("total");
  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setHabitId(goal?.habitId ?? h.activeHabits[0]?.id ?? "");
    setTarget(String(goal?.targetDays ?? 30));
    setStartDate(goal?.startDate ?? todayKey());
    setMode(goal?.mode ?? "total");
  }, [open, goal]);
  const options = h.data.habits.filter((habit) => !habit.archived || habit.id === goal?.habitId);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const targetDays = Number(target);
        if (!name.trim() || !h.getHabit(habitId) || !Number.isInteger(targetDays) || targetDays < 1 || targetDays > 3650 || !startDate || startDate > todayKey()) {
          toast.error("Choose a habit, a valid start date and a target between 1 and 3,650 days.");
          return;
        }
        const draft = { name: name.trim(), habitId, targetDays, startDate, mode };
        if (goal) h.updateGoal(goal.id, draft); else h.addGoal(draft);
        onOpenChange(false);
        toast.success(goal ? "Goal updated" : "Goal added");
      }}>
        <div className="space-y-2"><Label htmlFor="goal-name">Goal name</Label><Input id="goal-name" required maxLength={100} placeholder="30 days of daily reading" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="goal-habit">Habit</Label><Select value={habitId} onValueChange={setHabitId}><SelectTrigger id="goal-habit"><SelectValue placeholder="Choose a habit" /></SelectTrigger><SelectContent>{options.map((habit) => <SelectItem key={habit.id} value={habit.id}>{habit.icon} {habit.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label htmlFor="goal-target">Target days</Label><Input id="goal-target" type="number" required min={1} max={3650} value={target} onChange={(e) => setTarget(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="goal-start">Start date</Label><Input id="goal-start" type="date" required max={todayKey()} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="goal-counting">Count</Label><Select value={mode} onValueChange={(value) => setMode(value === "consecutive" ? "consecutive" : "total")}><SelectTrigger id="goal-counting"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="total">Total check-in days</SelectItem><SelectItem value="consecutive">Consecutive calendar days</SelectItem></SelectContent></Select></div>
        <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{goal ? "Save goal" : "Add goal"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}