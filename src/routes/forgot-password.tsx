import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Streakly" },
      { name: "description", content: "Get a password reset link for your Streakly account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError("Something went wrong sending the reset email. Please try again in a moment.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="text-center">
          <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
          <p className="mt-4 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>,
            we've sent a link to reset your password.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" search={{ redirect: undefined }} className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Send reset link
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" search={{ redirect: undefined }} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
