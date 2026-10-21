import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { CoachHistory } from "@/components/coach/CoachHistory";
import { createThread, loadThreads } from "@/lib/coach-history";
const CoachChat = lazy(() => import("@/components/coach/CoachChat"));
export const Route = createFileRoute("/coach/$threadId")({
  head: () => ({ meta: [
    { title: "Coach conversation — Streakly" },
    { name: "description", content: "Review your saved habit coach conversations and discuss your personal check-ins." },
    { property: "og:title", content: "Coach conversation — Streakly" },
    { property: "og:description", content: "Review your saved habit coach conversations and discuss your personal check-ins." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: CoachPage,
});
function CoachPage() {
  const { threadId } = Route.useParams();
  const [readyId, setReadyId] = useState<string>();
  useEffect(() => { loadThreads(); createThread(threadId); setReadyId(threadId); }, [threadId]);
  return <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
    <aside><CoachHistory activeId={threadId} /></aside>
    <section className="flex h-[72vh] min-h-96 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card" aria-label="Coach conversation">
      {readyId === threadId && <Suspense fallback={<p className="p-6 text-muted-foreground">Opening conversation…</p>}><CoachChat key={threadId} threadId={threadId} /></Suspense>}
    </section>
  </div>;
}