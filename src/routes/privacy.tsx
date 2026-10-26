import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL, TERMS_LAST_UPDATED } from "@/lib/terms";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Streakly" },
      { name: "description", content: "How Streakly collects, uses and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {TERMS_LAST_UPDATED}</p>
        <p className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Draft — this document is a placeholder and must be reviewed before launch.
        </p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">What we collect</h2>
            <p className="mt-1">
              Your account details (name and email), and the content you create in the app: habits,
              categories, routines, check-ins, notes, goals and your theme preferences. Conversations
              with the AI coach are stored in your browser, not on our servers.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">How we use it</h2>
            <p className="mt-1">
              Your data is used only to run the app for you: showing your checklist, computing
              streaks and statistics, syncing between your devices, and — when you chat with the
              coach — sending a summary of your own history to the AI so it can give relevant
              advice.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">How it's stored</h2>
            <p className="mt-1">
              Data is stored in a hosted database with row-level security, so each account can only
              read and write its own rows. Connections are encrypted in transit.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">What we never do</h2>
            <p className="mt-1">
              We don't sell your personal data, don't show advertising, and don't share your habit
              history with other users.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Your rights</h2>
            <p className="mt-1">
              You can edit your profile, export nothing hidden — everything you see is yours — and
              delete your account and all of its data at any time from Settings. Deletion is
              permanent and removes your profile, habits, logs and goals.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold text-foreground">Contact</h2>
            <p className="mt-1">
              Privacy questions:{" "}
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
