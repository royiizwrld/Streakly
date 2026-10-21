import { lazy, Suspense, useState } from "react";
import { Loader2, Sprout } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CoachHistory } from "./CoachHistory";
import { useMatchRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

// The chat (AI SDK + markdown renderer) is heavy; load it only when the coach is opened
// so every page becomes interactive quickly.
const CoachChat = lazy(() => import("./CoachChat"));

function CoachLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
      <SheetTitle className="sr-only">Habit coach</SheetTitle>
      <SheetDescription className="sr-only">Loading the habit coach</SheetDescription>
      <Loader2 className="size-6 animate-spin text-primary" />
      Opening your coach…
    </div>
  );
}

const preload = () => void import("./CoachChat");

export function CoachPanel() {
  const [open, setOpen] = useState(false);
  const matchRoute = useMatchRoute();
  if (matchRoute({ to: "/coach/$threadId", fuzzy: true })) return null;
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={preload}
        onFocus={preload}
        aria-label="Open habit coach"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-hero py-2 pl-2 pr-4 font-semibold text-primary-foreground shadow-card transition-transform hover:scale-105 md:bottom-6 md:right-6"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/20">
          <Sprout className="size-5" />
        </span>
        Coach
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button:first-child]:hidden">
          {open && (
            <div className="p-5"><SheetTitle className="mb-1 font-display text-lg">Sprout · Habit coach</SheetTitle><SheetDescription className="mb-5">Your personal habit conversations</SheetDescription><CoachHistory onSelect={() => setOpen(false)} /></div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

