import { useEffect, useSyncExternalStore } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createThread, deleteThread, getServerThreads, getThreads, loadThreads, subscribeThreads } from "@/lib/coach-history";

export function CoachHistory({ activeId, onSelect }: { activeId?: string; onSelect?: () => void }) {
  const threads = useSyncExternalStore(subscribeThreads, getThreads, getServerThreads);
  const navigate = useNavigate();
  useEffect(() => { loadThreads(); }, []);
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><h2 className="font-display font-bold">Coach chats</h2><Button size="icon" variant="outline" aria-label="New chat" title="New chat" onClick={() => { const thread = createThread(); onSelect?.(); void navigate({ to: "/coach/$threadId", params: { threadId: thread.id } }); }}><Plus /></Button></div>
    <div className="max-h-64 space-y-1 overflow-y-auto md:max-h-[65vh]">{threads.map((t) => <div key={t.id} className={`flex min-w-0 items-center rounded-lg ${activeId === t.id ? "bg-accent" : ""}`}>
      <Button variant="ghost" className="min-w-0 flex-1 justify-start" asChild><Link to="/coach/$threadId" params={{ threadId: t.id }} onClick={onSelect}><MessageSquare className="shrink-0" /><span className="truncate">{t.title}</span></Link></Button>
      <Button variant="ghost" size="icon" className="shrink-0" aria-label={`Delete chat ${t.title}`} title="Delete chat" onClick={() => { if (!confirm("Delete this conversation?")) return; deleteThread(t.id); if (activeId === t.id) { const next = getThreads()[0] ?? createThread(); void navigate({ to: "/coach/$threadId", params: { threadId: next.id } }); } }}><Trash2 className="size-4" /></Button>
    </div>)}{!threads.length && <p className="py-6 text-sm text-muted-foreground">No conversations yet.</p>}</div>
  </div>;
}