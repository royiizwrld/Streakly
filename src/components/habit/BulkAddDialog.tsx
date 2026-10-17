import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import type { Frequency, Habit } from "@/lib/habits/types";
import { HABIT_COLORS } from "@/lib/habits/seed";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FrequencyPicker, IconPicker } from "./pickers";

interface Row {
  key: string;
  name: string;
  icon: string;
  categoryId: string;
  routineId: string | null;
  frequency: Frequency;
}

interface ApiHabit {
  name: string;
  icon: string;
  category: string;
  frequencyType: "daily" | "weekdays" | "weekly";
  weekdays: number[] | null;
  timesPerWeek: number | null;
  routine: string;
}

const EXAMPLE = `Morning: wake up 6am, drink water, 20 min stretching, read 10 pages

Gym Mon/Wed/Fri, code 1 hour weekdays, journal before bed, no phone after 10pm`;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
function similar(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const wa = new Set(x.split(" ").filter((w) => w.length > 2));
  const wb = y.split(" ").filter((w) => w.length > 2);
  const overlap = wb.filter((w) => wa.has(w)).length;
  return overlap > 0 && overlap >= Math.min(wa.size, wb.length) * 0.6;
}

export function BulkAddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, addHabits } = useHabits();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRows(null);
    setError(null);
  };

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bulk-habits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await res.json().catch(() => null)) as { habits?: ApiHabit[]; error?: string } | null;
      if (!res.ok || !body || !Array.isArray(body.habits)) {
        setError(body?.error ?? "We couldn't understand the AI's answer. Try rephrasing your routine.");
        return;
      }
      if (!body.habits.length) {
        setError("We couldn't find any habits in that text. Try listing them more clearly.");
        return;
      }
      setRows(
        body.habits.map((h, i) => {
          const cat = data.categories.find((c) => c.name.toLowerCase() === String(h.category).toLowerCase());
          const rt = data.routines.find((r) => r.name.toLowerCase() === String(h.routine).toLowerCase());
          const frequency: Frequency =
            h.frequencyType === "weekdays" && h.weekdays?.length
              ? { type: "weekdays", days: [...new Set(h.weekdays)] }
              : h.frequencyType === "weekly" && h.timesPerWeek
                ? { type: "weekly", times: Math.min(7, Math.max(1, h.timesPerWeek)) }
                : { type: "daily" };
          return {
            key: `${i}-${h.name}`,
            name: String(h.name).slice(0, 80),
            icon: [...String(h.icon || "🎯")].slice(0, 2).join("") || "🎯",
            categoryId: cat?.id ?? "other",
            routineId: rt?.id ?? null,
            frequency,
          };
        }),
      );
    } catch {
      setError("Couldn't reach the AI. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, patch: Partial<Row>) => setRows((r) => r?.map((x) => (x.key === key ? { ...x, ...patch } : x)) ?? null);

  const confirm = () => {
    if (!rows?.length) return;
    const valid = rows.filter((r) => r.name.trim());
    addHabits(
      valid.map(
        (r, i): Omit<Habit, "id" | "createdAt" | "archived"> => ({
          name: r.name.trim(),
          icon: r.icon,
          color: HABIT_COLORS[i % HABIT_COLORS.length],
          categoryId: r.categoryId,
          routineId: r.routineId,
          frequency: r.frequency,
        }),
      ),
    );
    toast.success(`Added ${valid.length} habit${valid.length === 1 ? "" : "s"}`);
    setText("");
    reset();
    onOpenChange(false);
  };

  const existing = data.habits.filter((h) => !h.archived);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Bulk add habits</DialogTitle>
          <DialogDescription>Describe your routine in your own words. AI turns it into habits you can review before saving.</DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE}
              className="min-h-40"
              maxLength={4000}
            />
            <button type="button" className="text-xs font-medium text-primary underline-offset-4 hover:underline" onClick={() => setText(EXAMPLE)}>
              Use example
            </button>
            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {rows.length} habit{rows.length === 1 ? "" : "s"} found. Edit anything, then confirm — nothing is saved yet.
            </p>
            {rows.map((r) => {
              const dup = existing.find((h) => similar(h.name, r.name));
              return (
                <div key={r.key} className="space-y-2 rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <IconPicker value={r.icon} onChange={(icon) => update(r.key, { icon })} />
                    <Input value={r.name} maxLength={80} onChange={(e) => update(r.key, { name: e.target.value })} aria-label="Habit name" />
                    <Button variant="ghost" size="icon" aria-label="Remove row" onClick={() => setRows(rows.filter((x) => x.key !== r.key))}>
                      <Trash2 />
                    </Button>
                  </div>
                  {dup && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5" /> Possible duplicate of "{dup.icon} {dup.name}"
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Select value={r.categoryId} onValueChange={(categoryId) => update(r.key, { categoryId })}>
                      <SelectTrigger className="h-9" aria-label="Category">
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
                    <Select value={r.routineId ?? "none"} onValueChange={(v) => update(r.key, { routineId: v === "none" ? null : v })}>
                      <SelectTrigger className="h-9" aria-label="Routine">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {data.routines.map((x) => (
                          <SelectItem key={x.id} value={x.id}>
                            {x.icon} {x.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="none">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                    <FrequencyPicker compact value={r.frequency} onChange={(frequency) => update(r.key, { frequency })} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          {rows ? (
            <>
              <Button variant="ghost" onClick={reset}>
                Back
              </Button>
              <Button onClick={confirm} disabled={!rows.length}>
                Confirm & Add
              </Button>
            </>
          ) : (
            <Button onClick={parse} disabled={loading || !text.trim()}>
              {loading ? <Loader2 className="animate-spin" /> : <WandSparkles />}
              {loading ? "Reading your routine…" : "Turn into habits"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
