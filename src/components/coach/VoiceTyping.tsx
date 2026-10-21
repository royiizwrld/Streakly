import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import { createParser } from "eventsource-parser";
import { Button } from "@/components/ui/button";
import { recordWav } from "@/lib/voice/record-wav";

export function VoiceTyping({ disabled, onTranscript }: { disabled: boolean; onTranscript: (text: string) => void }) {
  const [state, setState] = useState<"idle" | "starting" | "recording" | "transcribing">("idle");
  const [error, setError] = useState("");
  const recorder = useRef<Awaited<ReturnType<typeof recordWav>> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); void recorder.current?.stop().catch(() => {}); recorder.current = null; };
  }, []);
  const cancel = () => { controller.current?.abort(); void recorder.current?.stop().catch(() => {}); recorder.current = null; setState("idle"); };
  const start = async () => {
    setError(""); setState("starting");
    try {
      const recording = await recordWav();
      if (!mounted.current) { await recording.stop(); return; }
      recorder.current = recording; setState("recording");
    } catch { if (mounted.current) { setError("Microphone access is unavailable. Allow microphone access or type your message."); setState("idle"); } }
  };
  const finish = async () => {
    const recording = recorder.current;
    if (!recording) return;
    recorder.current = null; setState("transcribing");
    const abort = new AbortController(); controller.current = abort;
    try {
      const file = await recording.stop();
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/transcribe", { method: "POST", body: form, signal: abort.signal });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? body.error?.message ?? body.error ?? "Voice typing is unavailable.");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No transcript received.");
      let transcript = ""; let complete = false; let streamError = "";
      const parser = createParser({ onEvent: ({ data }) => {
        if (data === "[DONE]") return;
        const event = JSON.parse(data);
        if (event.type === "transcript.text.delta") transcript += event.delta ?? "";
        if (event.type === "transcript.text.done") { transcript = event.text ?? transcript; complete = true; }
        if (event.type === "error" || event.error) streamError = event.message ?? event.error?.message ?? "Transcription failed.";
      } });
      const decoder = new TextDecoder();
      while (true) { const { value, done } = await reader.read(); if (done) break; parser.feed(decoder.decode(value, { stream: true })); }
      parser.feed(decoder.decode());
      if (streamError) throw new Error(streamError);
      if (!complete) throw new Error("The transcript was interrupted. Please record again.");
      if (!transcript.trim()) throw new Error("No speech detected. Please record again.");
      if (mounted.current && !abort.signal.aborted) onTranscript(transcript.trim());
    } catch (err) { if (mounted.current && !abort.signal.aborted) setError(err instanceof Error ? err.message : "Couldn't transcribe this recording."); }
    finally { if (mounted.current) setState("idle"); controller.current = null; }
  };
  return <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2">
      <Button type="button" variant={state === "recording" ? "secondary" : "ghost"} size="icon" disabled={disabled || state === "starting" || state === "transcribing"} aria-label={state === "recording" ? "Finish voice typing" : "Start voice typing"} title={state === "recording" ? "Finish recording" : "Voice typing"} onClick={() => void (state === "recording" ? finish() : start())}>{state === "starting" || state === "transcribing" ? <Loader2 className="animate-spin" /> : state === "recording" ? <Square className="text-destructive" /> : <Mic />}</Button>
      {state !== "idle" && <><span role="status" className="text-xs text-muted-foreground">{state === "recording" ? "Recording…" : state === "starting" ? "Opening mic…" : "Transcribing…"}</span>{state !== "starting" && <Button type="button" size="icon" variant="ghost" aria-label="Cancel voice typing" onClick={cancel}><X /></Button>}</>}
    </div>
    {error && <p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
  </div>;
}