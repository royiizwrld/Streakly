import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Flame, MoreVertical, Pencil, Plus, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import type { Habit } from "@/lib/habits/types";
import { describeFrequency } from "@/lib/habits/logic";
import { HabitFormDialog } from "@/components/habit/HabitFormDialog";
import { BulkAddDialog } from "@/components/habit/BulkAddDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/habits/")({
  validateSearch: (s: Record<string, unknown>): { bulk?: boolean } => (s.bulk ? { bulk: true } : {}),
  head: () => ({
    meta: [
      { title: "My Habits — Streakly" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Create, edit, archive and bulk-add habits with AI." },
      { property: "og:title", content: "My Habits — Streakly" },
      { property: "og:description", content: "Create, edit, archive and bulk-add habits with AI." },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const h = useHabits();
  const { bulk } = Route.useSearch();
  const [editing, setEditing] = useState<Habit | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  useEffect(() => {
    if (bulk) setBulkOpen(true);
  }, [bulk]);

  const list = h.data.habits.filter((x) => x.archived === showArchived);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Habits</h1>
          <p className="text-sm text-muted-foreground">{h.activeHabits.length} active</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setBulkOpen(true)}>
            <WandSparkles /> Bulk add
          </Button>
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus /> New habit
          </Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-muted p-1 text-sm font-medium w-fit">
        {[false, true].map((a) => (
          <button
            key={String(a)}
            onClick={() => setShowArchived(a)}
            className={`rounded-full px-4 py-1.5 ${showArchived === a ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {a ? "Archived" : "Active"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{showArchived ? "No archived habits." : "No habits yet — add one above."}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((x) => {
            const s = h.streak(x);
            const rate = h.rate30(x);
            return (
              <div key={x.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-xl text-2xl"
                  style={{ background: `color-mix(in oklch, ${x.color} 22%, transparent)` }}
                >
                  {x.icon}
                </span>
                <Link to="/habits/$habitId" params={{ habitId: x.id }} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{x.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {describeFrequency(x.frequency)} · {h.categoryName(x.categoryId)} · {h.routineName(x.routineId)}
                  </p>
                  <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Flame className="size-3.5 text-primary" />
                      {s.current} {s.current === 1 ? s.unit.replace(/s$/, "") : s.unit}
                    </span>
                    <span>{rate == null ? "—" : `${Math.round(rate * 100)}%`} last 30d</span>
                  </p>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Options for ${x.name}`}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(x);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        h.updateHabit(x.id, { archived: !x.archived });
                        toast.success(x.archived ? "Habit restored" : "Habit archived");
                      }}
                    >
                      {x.archived ? <ArchiveRestore /> : <Archive />} {x.archived ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(x)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} habit={editing} />
      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This removes the habit and its whole history. Archive instead to keep the history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) h.deleteHabit(deleting.id);
                setDeleting(null);
                toast.success("Habit deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
