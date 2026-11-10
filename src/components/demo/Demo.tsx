import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { endDemoMode, isDemoMode, startDemoMode } from "@/lib/demo";

export function TryDemoButton() {
  const navigate = useNavigate();
  return (
    <div className="mt-6 border-t border-border pt-5">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          startDemoMode();
          void navigate({ to: "/today" });
        }}
      >
        <Sparkles /> Try Demo Mode
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Explore with sample habits — no account needed.</p>
    </div>
  );
}

export function DemoBanner() {
  const { user } = useAuth();
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(!user && isDemoMode()), [user]);
  if (!demo) return null;
  return (
    <div role="status" className="border-b border-border bg-accent px-4 py-2 text-center text-sm text-accent-foreground">
      You are exploring in Demo Mode.{" "}
      <Link to="/signup" onClick={() => endDemoMode()} className="font-semibold underline underline-offset-2">
        Create an Account
      </Link>{" "}
      to save your habits permanently.
    </div>
  );
}
