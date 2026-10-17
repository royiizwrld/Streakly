import { createOpenAI } from "@ai-sdk/openai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "openai/gpt-6-astra";

/** Build a per-request Responses provider. Throws a Response when the key is missing. */
export function createGateway(request: Request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw Response.json({ error: "The AI service isn't configured yet." }, { status: 500 });
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { model: provider.responses(CHAT_MODEL), runIdFetch };
}

export const reasoningOptions = (effort: "low" | "medium" = "medium") => ({
  openai: {
    forceReasoning: true,
    reasoningEffort: effort,
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
});

/** Map gateway/provider errors to a friendly status + message. */
export function describeAiError(err: unknown): { status: number; message: string } {
  const e = err as { statusCode?: number; status?: number; message?: string };
  const status = e?.statusCode ?? e?.status ?? 500;
  if (status === 429) return { status, message: "The coach is a bit busy right now. Please try again in a minute." };
  if (status === 402) return { status, message: "AI credits have run out for this workspace. Add credits to keep using AI features." };
  if (status === 403) return { status, message: e?.message || "AI access is currently blocked for this workspace." };
  return { status: status >= 400 && status < 600 ? status : 500, message: "Something went wrong talking to the AI. Please try again." };
}
