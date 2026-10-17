import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import type { Habit } from "@/lib/habits/types";
import { HABIT_COLORS } from "@/lib/habits/seed";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker, FrequencyPicker, IconPicker } from "./pickers";

type Draft = Omit<Habit, "id" | "createdAt" | "archived">;

const blank: Draft = {
  name: "",
  icon: "🎯",
  color: HABIT_COLORS[0],
  categoryId: "health",
  routineId: "morning",
  frequency: { type: "daily" },
  reminder: "",
};

export function HabitFormDialog({ open, onOpenChange, habit }: { open: boolean; onOpenChange: (o: boolean) => void; habit?: Habit }) {
  const { data, addHabit, updateHabit, addCategory } = useHabits();
  const [draft, setDraft] = useState<Draft>(blank);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    if (open) setDraft(habit ? { ...habit } : blank);
  }, [open, habit]);

  const save = () => {
    const name = draft.name.trim();
    if (!name) return toast.error("Give your habit a name");
    if (name.length > 80) return toast.error("Keep the name under 80 characters");
    const clean = { ...draft, name, reminder: draft.reminder?.trim() || undefined };
    if (habit) updateHabit(habit.id, clean);
    else addHabit(clean);
    toast.success(habit ? "Habit updated" : "Habit added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{habit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex gap-3">
            <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                value={draft.name}
                maxLength={80}
                placeholder="e.g. Read 10 pages"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.categoryId} onValueChange={(categoryId) => setDraft({ ...draft, categoryId })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1.5">
                <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="h-8 text-xs" maxLength={30} />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!newCat.trim()) return;
                    const c = addCategory(newCat);
                    setDraft({ ...draft, categoryId: c.id });
                    setNewCat("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Routine</Label>
              <Select value={draft.routineId ?? "none"} onValueChange={(v) => setDraft({ ...draft, routineId: v === "none" ? null : v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.routines.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Target frequency</Label>
            <FrequencyPicker value={draft.frequency} onChange={(frequency) => setDraft({ ...draft, frequency })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habit-reminder">Reminder (optional)</Label>
            <Input
              id="habit-reminder"
              value={draft.reminder ?? ""}
              maxLength={30}
              placeholder="e.g. 7:00 AM, after coffee"
              onChange={(e) => setDraft({ ...draft, reminder: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{habit ? "Save changes" : "Add habit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
