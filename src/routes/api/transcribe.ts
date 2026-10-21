import { createFileRoute } from "@tanstack/react-router";

const MAX_BODY = 25 * 1024 * 1024;
export const Route = createFileRoute("/api/transcribe")({ server: { handlers: {
  POST: async ({ request }) => {
    try {
      if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return Response.json({ error: "An audio recording is required." }, { status: 400 });
      if (Number(request.headers.get("content-length")) > MAX_BODY) return Response.json({ error: "Recording is too large. Please record a shorter message." }, { status: 413 });
      const reader = request.body?.getReader();
      if (!reader) return Response.json({ error: "No recording received." }, { status: 400 });
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY) { await reader.cancel(); return Response.json({ error: "Recording is too large. Please record a shorter message." }, { status: 413 }); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const form = await new Response(bytes, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size < 2048 || file.size > MAX_BODY - 4096 || !file.type.startsWith("audio/")) return Response.json({ error: "Please record a short spoken message." }, { status: 400 });
      const key = process.env["LOVABLE_API_KEY"];
      if (!key) return Response.json({ error: "Voice typing isn't configured yet." }, { status: 401 });
      const { transcribe } = await import("@/lib/voice/transcribe.server");
      const response = await transcribe({ baseURL: "https://ai.gateway.lovable.dev", apiKey: key, model: "openai/gpt-transcribe", maxFileBytes: MAX_BODY - 4096, audioOnly: true }, file, { signal: request.signal });
      return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "text/event-stream", "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return new Response(null, { status: 499 });
      return Response.json({ error: "Couldn't read this recording. Please try a new recording." }, { status: 400 });
    }
  },
} } });