import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { useInstall } from "@/context/InstallContext";
import { useHabits } from "@/context/HabitsContext";
import { Button } from "@/components/ui/button";
import { readStored, writeStored } from "@/lib/browser-storage";
import { KEYS, shouldShowInstallBanner } from "@/lib/pwa/banner-rules";
import { IosInstallDialog } from "./IosInstallDialog";

/** Floating install prompt shown only inside the signed-in app. */
export function InstallBanner() {
  const { canPrompt, isIosSafari, isStandalone, promptInstall } = useInstall();
  const { activeHabits, ready } = useHabits();
  const [visits, setVisits] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Count one visit per browser session.
    let n = Number(readStored(KEYS.visits) ?? "0") || 0;
    try {
      if (!sessionStorage.getItem("ht-visit-counted")) {
        sessionStorage.setItem("ht-visit-counted", "1");
        n += 1;
        writeStored(KEYS.visits, String(n));
      }
    } catch {
      /* storage blocked: treat as first visit */
    }
    setVisits(n);
  }, []);

  const show = ready && !hidden && shouldShowInstallBanner({
    installable: canPrompt || isIosSafari,
    standalone: isStandalone,
    dismissedAt: Number(readStored(KEYS.dismissedAt)) || null,
    never: readStored(KEYS.never) === "1",
    visits,
    habitCount: activeHabits.length,
    now: Date.now(),
  });

  const notNow = () => {
    writeStored(KEYS.dismissedAt, String(Date.now()));
    setHidden(true);
  };

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !iosOpen) notNow(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, iosOpen]);

  if (!show) return null;

  const install = async () => {
    if (!canPrompt) return setIosOpen(true);
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      writeStored(KEYS.never, "1");
      setHidden(true);
      toast.success("Thanks for installing Habit Tracker!");
    } else notNow();
  };

  return (
    <>
      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby="install-title"
        aria-describedby="install-desc"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-card md:inset-x-auto md:bottom-6 md:left-6 md:w-96 md:rounded-3xl md:pb-5"
      >
        <button onClick={notNow} aria-label="Close install prompt" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
          <X className="size-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <img src="/icon-192.png" alt="" className="size-12 rounded-xl" />
          <div>
            <h2 id="install-title" className="font-display text-lg font-bold">Install Habit Tracker</h2>
            <p id="install-desc" className="text-sm text-muted-foreground">Open it from your home screen in one tap and check in faster every day.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={install} className="flex-1"><Download /> {canPrompt ? "Install" : "How to install"}</Button>
          <Button variant="outline" onClick={notNow}>Not now</Button>
        </div>
        <button onClick={() => { writeStored(KEYS.never, "1"); setHidden(true); }} className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline">
          Don't ask again
        </button>
      </div>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}
