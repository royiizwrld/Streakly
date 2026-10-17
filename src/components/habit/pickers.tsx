import { HABIT_COLORS, HABIT_ICONS } from "@/lib/habits/seed";
import type { Frequency } from "@/lib/habits/types";
import { WEEKDAY_SHORT } from "@/lib/habits/dates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IconPicker({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose icon"
          className={cn("grid size-11 shrink-0 place-items-center rounded-xl border border-input bg-card text-2xl hover:bg-accent", className)}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="grid grid-cols-8 gap-1">
          {HABIT_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn("grid size-8 place-items-center rounded-lg text-lg hover:bg-accent", i === value && "bg-accent ring-2 ring-ring")}
            >
              {i}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {HABIT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          className={cn("size-8 rounded-full ring-offset-2 ring-offset-background", value === c && "ring-2 ring-ring")}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

export function FrequencyPicker({ value, onChange, compact }: { value: Frequency; onChange: (f: Frequency) => void; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", compact && "gap-1.5")}>
      <Select
        value={value.type}
        onValueChange={(t) =>
          onChange(
            t === "daily"
              ? { type: "daily" }
              : t === "weekdays"
                ? { type: "weekdays", days: value.type === "weekdays" ? value.days : [1, 3, 5] }
                : { type: "weekly", times: value.type === "weekly" ? value.times : 3 },
          )
        }
      >
        <SelectTrigger className={compact ? "h-9" : undefined} aria-label="Frequency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Every day</SelectItem>
          <SelectItem value="weekdays">Specific weekdays</SelectItem>
          <SelectItem value="weekly">X times per week</SelectItem>
        </SelectContent>
      </Select>
      {value.type === "weekdays" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const on = value.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const days = on ? value.days.filter((x) => x !== d) : [...value.days, d];
                  if (days.length) onChange({ type: "weekdays", days });
                }}
                className={cn(
                  "h-8 flex-1 rounded-lg border text-xs font-semibold",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground",
                )}
              >
                {WEEKDAY_SHORT[d].slice(0, 2)}
              </button>
            );
          })}
        </div>
      )}
      {value.type === "weekly" && (
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            min={1}
            max={7}
            value={value.times}
            onChange={(e) => onChange({ type: "weekly", times: Math.min(7, Math.max(1, Number(e.target.value) || 1)) })}
            className="h-9 w-20"
            aria-label="Times per week"
          />
          times per week
        </div>
      )}
    </div>
  );
}
