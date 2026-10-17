import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, toKey, todayKey } from "@/lib/habits/dates";
import { Button } from "@/components/ui/button";

export function MonthSelector({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  const shift = (n: number) => onChange(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const now = new Date();
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous month" onClick={() => shift(-1)}>
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center text-sm font-semibold">
        {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Next month"
        disabled={isCurrent}
        onClick={() => shift(1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

/** value(key) → 0..1 completion, or null when nothing was due / future. */
export function Heatmap({
  month,
  value,
  onSelect,
  color = "var(--primary)",
}: {
  month: Date;
  value: (key: string) => number | null;
  onSelect?: (key: string) => void;
  color?: string;
}) {
  const first = toKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const today = todayKey();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((key, i) => {
          if (!key) return <span key={i} />;
          const future = key > today;
          const v = future ? null : value(key);
          const pct = v == null ? 0 : Math.round(15 + v * 85);
          const bg = v == null || v === 0 ? "var(--heat-0)" : `color-mix(in oklch, ${color} ${pct}%, var(--heat-0))`;
          const label = `${key}: ${v == null ? "nothing due" : `${Math.round(v * 100)}% complete`}`;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              disabled={future || !onSelect}
              onClick={() => onSelect?.(key)}
              className={`relative aspect-square rounded-lg text-[11px] font-medium transition-transform enabled:hover:scale-105 ${
                future ? "opacity-40" : ""
              } ${key === today ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""} ${
                v != null && v >= 0.6 ? "text-primary-foreground" : "text-muted-foreground"
              }`}
              style={{ background: bg }}
            >
              {Number(key.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        Less
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span
            key={v}
            className="size-3 rounded"
            style={{
              background: v === 0 ? "var(--heat-0)" : `color-mix(in oklch, ${color} ${15 + v * 85}%, var(--heat-0))`,
            }}
          />
        ))}
        More
      </div>
    </div>
  );
}
