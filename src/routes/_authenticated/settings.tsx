import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PALETTES, useTheme, type Mode } from "@/context/ThemeContext";
import { useHabits } from "@/context/HabitsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { removeStored } from "@/lib/browser-storage";
import { clearThreads } from "@/lib/coach-history";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Streakly" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Themes, dark mode, categories, routines and data settings." },
      { property: "og:title", content: "Settings — Streakly" },
      { property: "og:description", content: "Themes, dark mode, categories, routines and data settings." },
    ],
  }),
  component: SettingsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function SettingsPage() {
  const { mode, setMode, palette, setPalette } = useTheme();
  const h = useHabits();
  const [cat, setCat] = useState("");
  const [routine, setRoutine] = useState("");
  const hasSample = h.data.habits.some((x) => x.sample);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Settings</h1>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ] as [Mode, string, typeof Sun][]
          ).map(([m, label, Icon]) => (
            <Button
              variant="outline"
              aria-pressed={mode === m}
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex h-auto flex-col items-center gap-1 rounded-2xl border p-3 text-sm font-medium",
                mode === m ? "border-primary bg-accent" : "border-border",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Button>
          ))}
        </div>
        <p className="pt-2 text-sm font-semibold">Theme</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PALETTES.map((p) => (
            <Button
              variant="outline"
              aria-pressed={palette === p.id}
              key={p.id}
              data-palette={p.id}
              onClick={() => setPalette(p.id)}
              className={cn(
                "flex h-auto justify-start items-center gap-2 rounded-2xl border p-2.5 text-sm font-medium",
                palette === p.id ? "border-primary ring-2 ring-ring" : "border-border",
              )}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-palette-preview text-primary-foreground"
              >
                {palette === p.id && <Check className="size-4" />}
              </span>
              {p.name}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Categories">
        <div className="flex flex-wrap gap-2">
          {h.data.categories.map((c) => (
            <span key={c.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {c.name}
              {!c.builtIn && (
                <button aria-label={`Delete ${c.name}`} onClick={() => h.deleteCategory(c.id)} className="text-muted-foreground hover:text-destructive">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cat.trim()) return;
            h.addCategory(cat);
            setCat("");
          }}
        >
          <Input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="New category" maxLength={30} />
          <Button type="submit">Add</Button>
        </form>
      </Section>

      <Section title="Routines">
        <div className="flex flex-wrap gap-2">
          {h.data.routines.map((r) => (
            <span key={r.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {r.icon} {r.name}
              <button aria-label={`Delete ${r.name}`} onClick={() => h.deleteRoutine(r.id)} className="text-muted-foreground hover:text-destructive">
                ×
              </button>
            </span>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!routine.trim()) return;
            h.addRoutine(routine, "🕐");
            setRoutine("");
          }}
        >
          <Input value={routine} onChange={(e) => setRoutine(e.target.value)} placeholder="New routine, e.g. Lunch break" maxLength={30} />
          <Button type="submit">Add</Button>
        </form>
      </Section>

      <Section title="Data">
        <p className="text-sm text-muted-foreground">Everything is stored in this browser.</p>
        <div className="flex flex-wrap gap-2">
          {hasSample ? (
            <Button
              variant="secondary"
              onClick={() => {
                h.clearSample();
                toast.success("Sample data cleared");
              }}
            >
              <Trash2 /> Clear sample data
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => h.loadSample()}>
              Load sample data
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => {
              if (confirm("Delete all habits and history? This can't be undone.")) {
                h.resetAll();
                removeStored("ht-coach-chat");
                clearThreads();
                toast.success("All data reset");
              }
            }}
          >
            Reset everything
          </Button>
        </div>
      </Section>
    </div>
  );
}
