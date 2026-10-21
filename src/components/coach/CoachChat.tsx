import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Sprout, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useHabits } from "@/context/HabitsContext";
import { buildCoachSummary } from "@/lib/habits/summary";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SuggestionCard, type ProposedChange } from "./SuggestionCard";
import { getThreads, saveThread } from "@/lib/coach-history";
import { VoiceTyping } from "./VoiceTyping";
import { Tool, ToolHeader, ToolContent, ToolInput } from "@/components/ai-elements/tool";

const STARTERS = [
  "Which habits am I struggling with?",
  "Why do I keep missing my gym days?",
  "How was my week?",
  "Which habit should I focus on first?",
  "Am I too ambitious with my list?",
  "Give me a weekly review",
];

export function CoachMark({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl bg-hero text-primary-foreground ${className}`}>
      <Sprout className="size-1/2" strokeWidth={2.4} />
    </span>
  );
}

export default function CoachChat({ threadId }: { threadId: string }) {
  const { data } = useHabits();
  const dataRef = useRef(data);
  dataRef.current = data;
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: threadId,
    messages: getThreads().find((t) => t.id === threadId)?.messages ?? [],
    transport: new DefaultChatTransport({
      api: "/api/coach",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, summary: buildCoachSummary(dataRef.current) },
      }),
    }),
    onError: (err) => {
      let msg = err.message;
      try {
        msg = JSON.parse(err.message).error ?? msg;
      } catch {
        /* plain text */
      }
      toast.error(msg || "The coach couldn't respond. Please try again.");
    },
  });

  useEffect(() => {
    if (status === "streaming") return;
    saveThread(threadId, messages);
  }, [messages, status, threadId]);
  useEffect(() => () => { stop(); }, [stop]);

  useEffect(() => {
    if (status === "ready" || status === "error") textareaRef.current?.focus();
  }, [status]);

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  const last = messages[messages.length - 1];
  const showTyping =
    status === "submitted" || (status === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text));

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <CoachMark />
        <div className="flex-1">
          <h1 className="font-display text-base font-bold">Sprout · Habit coach</h1>
          <p className="text-xs text-muted-foreground">{buildCoachSummary(data).hasUserHistory ? "Your personal check-ins · Sample history excluded" : "No personal check-ins yet · Sample history excluded"}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Clear chat"
          title="Clear chat"
          disabled={!messages.length || busy}
          onClick={() => {
            setMessages([]);
            saveThread(threadId, []);
          }}
        >
          <Trash2 />
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="gap-5 px-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-6 text-center">
              <CoachMark className="mx-auto size-16" />
              <div>
                <p className="font-display text-lg font-bold">Hi, I'm Sprout 🌱</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Ask me about your habits — I'll look at your real check-in history, spot patterns and suggest small changes.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <Button variant="outline"
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm hover:border-primary hover:bg-accent"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent
                className={
                  m.role === "user"
                    ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                    : "w-full bg-transparent p-0"
                }
              >
                {m.parts.map((part, i) => {
                  if (part.type === "text")
                    return m.role === "user" ? <p key={i}>{part.text}</p> : <MessageResponse key={i}>{part.text}</MessageResponse>;
                  if (part.type === "tool-propose_change") {
                    return (
                      <Tool key={i} defaultOpen={false}>
                        <ToolHeader type="tool-propose_change" state={part.state} title="Habit adjustment" />
                        <ToolContent><ToolInput input={part.input} />
                        {part.state !== "input-streaming" && part.input ? (
                          <SuggestionCard id={part.toolCallId} change={part.input as ProposedChange} />
                        ) : null}
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {showTyping && (
            <div className="flex items-center gap-2 text-sm">
              <CoachMark className="size-7" />
              <Shimmer>Looking at your check-ins…</Shimmer>
            </div>
          )}
          {error && status === "error" && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg) => send(msg.text ?? input)}>
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your habits…"
          />
          <PromptInputFooter className="justify-between">
            <VoiceTyping disabled={busy} onTranscript={(text) => { setInput((draft) => draft ? `${draft} ${text}` : text); textareaRef.current?.focus(); }} />
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">General habit guidance, not medical advice.</p>
      </div>
    </>
  );
}
