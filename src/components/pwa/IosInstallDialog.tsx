import { PlusSquare, Share } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function IosInstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Install Habit Tracker</DialogTitle>
          <DialogDescription>Add it to your Home Screen in three quick steps.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          <li className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-bold">1</span> Tap the <Share className="inline size-4" aria-label="Share" /> <strong>Share</strong> button in Safari's toolbar.</li>
          <li className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-bold">2</span> Scroll and choose <PlusSquare className="inline size-4" aria-hidden /> <strong>Add to Home Screen</strong>.</li>
          <li className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-bold">3</span> Tap <strong>Add</strong> in the top corner.</li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
