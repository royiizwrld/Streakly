import { Link } from "@tanstack/react-router";
import { Check, Flame, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { useHabits } from "@/context/HabitsContext";
import type { Habit } from "@/lib/habits/types";
import { weekCountThrough } from "@/lib/habits/logic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HabitRow({ habit, dateKey }: { habit: Habit; dateKey: string }) {
  const { isDone, toggle, streak, data, setNote } = useHabits();
  const done = isDone(habit.id, dateKey);
  const s = streak(habit);
  const note = data.logs[habit.id]?.[dateKey]?.note ?? "";
  const [draft, setDraft] = useState(note);
  useEffect(() => setDraft(note), [note]);
  const weekly = habit.frequency.type === "weekly" ? habit.frequency.times : null;
  const weekDone = weekly ? weekCountThrough(data.logs, habit.id, dateKey) : 0;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border bg-card p-2.5 pr-3 shadow-card transition-colors",
        done ? "border-transparent bg-accent/60" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => toggle(habit.id, dateKey)}
        aria-pressed={done}
        aria-label={done ? `Undo ${habit.name}` : `Mark ${habit.name} done`}
        className="flex min-h-14 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl border-2 text-2xl transition-all active:scale-90",
            done && "border-transparent",
          )}
          style={done ? { background: habit.color } : { borderColor: `color-mix(in oklch, ${habit.color} 45%, transparent)` }}
        >
          {done ? <Check className="size-6 text-primary-foreground" strokeWidth={3} /> : habit.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-semibold", done && "text-muted-foreground line-through decoration-2")}>
            {habit.name}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {weekly && (
              <span className="flex items-center gap-1.5">
                <span className="flex gap-0.5">
                  {Array.from({ length: weekly }, (_, i) => (
                    <span key={i} className="h-1.5 w-3 rounded-full" style={{ background: i < weekDone ? habit.color : "var(--heat-0)" }} />
                  ))}
                </span>
                {weekDone}/{weekly} this week
              </span>
            )}
            {s.current > 0 && (
              <span className="flex items-center gap-0.5">
                <Flame className="size-3.5 text-primary" />
                {s.current} {s.unit === "weeks" ? "wk" : "d"}
              </span>
            )}
            {habit.reminder && <span>⏰ {habit.reminder}</span>}
          </span>
        </span>
      </button>
      {done && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("rounded-full", note && "text-primary")} aria-label="Add a note">
              <MessageSquareText />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2">
            <p className="text-sm font-semibold">Note for this check-in</p>
            <Textarea
              value={draft}
              maxLength={200}
              placeholder="e.g. felt tired, did a short version"
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button size="sm" className="w-full" onClick={() => setNote(habit.id, dateKey, draft)}>
              Save note
            </Button>
          </PopoverContent>
        </Popover>
      )}
      <Link
        to="/habits/$habitId"
        params={{ habitId: habit.id }}
        className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        Details
      </Link>
    </div>
  );
}
