import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Verifies the bearer token on an API request and returns a database client that
 * acts as that user (row-level security applies), or a 401 Response.
 */
export async function requireRequestUser(request: Request): Promise<{ supabase: SupabaseClient<Database>; userId: string } | Response> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!url || !key || token.split(".").length !== 3) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const supabase = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return Response.json({ error: "Please sign in again." }, { status: 401 });
  return { supabase, userId: data.claims.sub };
}

/** YYYY-MM-DD for "now" in an IANA time zone, falling back to UTC. */
export function todayInZone(tz: string | null | undefined): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
