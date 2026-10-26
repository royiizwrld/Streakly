import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL, TERMS_LAST_UPDATED } from "@/lib/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Streakly" },
      { name: "description", content: "Terms and conditions for using the Streakly habit tracker." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold">Terms and Conditions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {TERMS_LAST_UPDATED}</p>
        <p className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Draft — this document is a placeholder and must be reviewed before launch.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">1. The service</h2>
            <p className="mt-1">
              Streakly is a personal habit and routine tracker. It lets you create habits, check them
              off, view streaks and statistics, and chat with an AI habit coach.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">2. Your account</h2>
            <p className="mt-1">
              You need an account to use the app. You are responsible for keeping your password
              confidential and for the activity on your account.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">3. Acceptable use</h2>
            <p className="mt-1">
              Don't misuse the service: no attempting to access other users' data, no disrupting the
              service, and no unlawful content.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">4. AI coach</h2>
            <p className="mt-1">
              The AI coach provides general habit-building guidance based on the data you choose to
              track. It is not medical, psychological or professional advice.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">5. Availability</h2>
            <p className="mt-1">
              The service is provided "as is". We aim for high availability but don't guarantee
              uninterrupted access.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">6. Ending your account</h2>
            <p className="mt-1">
              You can delete your account and all associated data at any time from Settings. Deletion
              is permanent.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">7. Contact</h2>
            <p className="mt-1">
              Questions about these terms:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
