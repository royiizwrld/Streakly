import { createFileRoute } from "@tanstack/react-router";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createGateway, describeAiError, reasoningOptions } from "@/lib/ai/provider.server";

const ParsedHabit = z.object({
  name: z.string(),
  icon: z.string(),
  category: z.enum(["Health", "Fitness", "Coding", "Reading", "Learning", "Mindfulness", "Social", "Other"]),
  frequencyType: z.enum(["daily", "weekdays", "weekly"]),
  weekdays: z.array(z.number().int().min(0).max(6)).nullable(),
  timesPerWeek: z.number().int().min(1).max(7).nullable(),
  routine: z.enum(["Morning", "Afternoon", "Evening"]),
});
const Result = z.object({ habits: z.array(ParsedHabit) });

const INSTRUCTIONS = `You turn a messy description of someone's routine into a clean list of trackable habits.
Rules:
- One habit per distinct action. Keep names short and actionable (e.g. "Drink water", "Stretch 20 min", "Read 10 pages").
- icon: a single emoji that fits the habit.
- category: pick the best of Health, Fitness, Coding, Reading, Learning, Mindfulness, Social, Other.
- frequencyType: "daily" unless days are given. Specific days → "weekdays" with weekdays as numbers (0=Sunday,1=Monday … 6=Saturday); "weekdays"/"workdays" means [1,2,3,4,5]. "N times a week" → "weekly" with timesPerWeek.
- weekdays is null unless frequencyType is "weekdays"; timesPerWeek is null unless "weekly".
- routine: Morning, Afternoon or Evening based on the time of day mentioned; "before bed", "after 10pm", "night" → Evening. If unknown, guess sensibly.
- Ignore text that is not a habit. If nothing usable is present, return an empty list.`;

export const Route = createFileRoute("/api/bulk-habits")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let text: string;
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.trim() : "";
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!text) return Response.json({ error: "Describe your routine first." }, { status: 400 });
        if (text.length > 4000) return Response.json({ error: "That's a lot! Please keep it under 4000 characters." }, { status: 400 });

        try {
          const { model } = createGateway(request);
          const result = streamText({
            model,
            instructions: INSTRUCTIONS,
            prompt: text,
            output: Output.object({ schema: Result }),
            abortSignal: request.signal,
            providerOptions: reasoningOptions("low"),
          });
          const output = await result.output;
          const parsed = Result.safeParse(output);
          if (!parsed.success) {
            return Response.json({ error: "The AI returned something we couldn't read. Try rephrasing your routine." }, { status: 422 });
          }
          return Response.json({ habits: parsed.data.habits.slice(0, 30) });
        } catch (err) {
          if (err instanceof Response) return err;
          console.error(err);
          const name = (err as { name?: string })?.name ?? "";
          if (/NoObjectGenerated|JSON|TypeValidation/i.test(name)) {
            return Response.json({ error: "The AI returned something we couldn't read. Try rephrasing your routine." }, { status: 422 });
          }
          const { status, message } = describeAiError(err);
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
