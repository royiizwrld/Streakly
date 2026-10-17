import { useHabits } from "@/context/HabitsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Filters {
  category: string; // "all" | id
  routine: string; // "all" | "none" | id
}

export const NO_FILTER: Filters = { category: "all", routine: "all" };

export function applyFilters<T extends { categoryId: string; routineId: string | null }>(items: T[], f: Filters) {
  return items.filter(
    (h) =>
      (f.category === "all" || h.categoryId === f.category) &&
      (f.routine === "all" || (f.routine === "none" ? !h.routineId : h.routineId === f.routine)),
  );
}

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const { data } = useHabits();
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={value.category} onValueChange={(category) => onChange({ ...value, category })}>
        <SelectTrigger className="h-9 w-[160px] rounded-full bg-card" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {data.categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={value.routine} onValueChange={(routine) => onChange({ ...value, routine })}>
        <SelectTrigger className="h-9 w-[160px] rounded-full bg-card" aria-label="Filter by routine">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All routines</SelectItem>
          {data.routines.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.icon} {r.name}
            </SelectItem>
          ))}
          <SelectItem value="none">Anytime</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
