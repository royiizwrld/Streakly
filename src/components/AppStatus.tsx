import { useEffect, useRef, type ReactNode } from "react";
import { CloudOff, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/context/HabitsContext";
import { PALETTES, useTheme, type Mode } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Holds pages until the account's data loads, with a retry when it fails. */
export function DataGate({ children }: { children: ReactNode }) {
  const h = useHabits();
  if (h.loadError)
    return (
      <div role="alert" className="mx-auto mt-10 max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <CloudOff className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <p>{h.loadError}</p>
        <Button onClick={h.reload}><RefreshCw /> Retry</Button>
      </div>
    );
  return <>{children}</>;
}

export function SyncNotice() {
  const h = useHabits();
  if (h.syncStatus !== "error" || !h.online) return null;
  return (
    <div role="status" className="mb-4 flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
      <CloudOff className="size-5 shrink-0 text-destructive" aria-hidden />
      <span className="flex-1">Some changes haven't been saved yet. They're kept on this device and will retry automatically.</span>
      <Button size="sm" variant="outline" onClick={h.retrySync}>Retry</Button>
    </div>
  );
}

/** Small header pill: offline with pending count, or syncing. */
export function SavingDot() {
  const h = useHabits();
  const n = h.pendingCount;
  if (!h.online)
    return (
      <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        <WifiOff className="size-3.5" aria-hidden />
        Offline{n > 0 ? ` (${n} change${n === 1 ? "" : "s"} pending)` : ""}
      </span>
    );
  if (h.syncStatus !== "saving") return null;
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only sm:not-sr-only">Syncing{n > 1 ? ` ${n}` : ""}…</span>
    </span>
  );
}

export function ImportPrompt() {
  const h = useHabits();
  const count = h.localImport?.habits.filter((x) => !x.sample).length ?? 0;
  return (
    <Dialog open={!!h.localImport} onOpenChange={(o) => !o && h.skipImport()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>We found habits saved on this device</DialogTitle>
          <DialogDescription>Import them to your account? ({count} habit{count === 1 ? "" : "s"} with their check-ins.)</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={h.skipImport}>Skip</Button>
          <Button onClick={h.importLocal}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Applies the theme saved on the profile, saves later changes back, and records the time zone. */
export function ProfilePrefsSync() {
  const { user, profile } = useAuth();
  const { mode, palette, setMode, setPalette } = useTheme();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !profile || applied.current === user.id) return;
    applied.current = user.id;
    if (profile.theme === "light" || profile.theme === "dark" || profile.theme === "system") setMode(profile.theme as Mode);
    const p = PALETTES.find((x) => x.id === profile.palette);
    if (p) setPalette(p.id);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== profile.timezone) // Query builders are lazy; .then() sends the request.
      void supabase.from("profiles").update({ timezone: tz }).eq("id", user.id).then(() => {});
  }, [user, profile, setMode, setPalette]);

  useEffect(() => {
    if (!user || applied.current !== user.id) return;
    const t = setTimeout(() => void supabase.from("profiles").update({ theme: mode, palette }).eq("id", user.id).then(() => {}), 400);
    return () => clearTimeout(t);
  }, [mode, palette, user]);

  return null;
}
