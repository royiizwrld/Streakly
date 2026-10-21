import { useState } from "react";
import { Sprout } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CoachHistory } from "./CoachHistory";
import { useMatchRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CoachPanel() {
  const [open, setOpen] = useState(false);
  const matchRoute = useMatchRoute();
  if (matchRoute({ to: "/coach/$threadId", fuzzy: true })) return null;
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open habit coach"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-hero py-2 pl-2 pr-4 font-semibold text-primary-foreground shadow-card transition-transform hover:scale-105 md:bottom-6 md:right-6"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/20">
          <Sprout className="size-5" />
        </span>
        Coach
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {open && (
            <div className="p-5">
              <SheetTitle className="mb-1 font-display text-lg">Sprout · Habit coach</SheetTitle>
              <SheetDescription className="mb-5">
                Your personal habit conversations
              </SheetDescription>
              <CoachHistory onSelect={() => setOpen(false)} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
