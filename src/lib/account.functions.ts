import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's habit data and account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { confirm: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.confirm !== "DELETE") throw new Error("Type DELETE to confirm.");
    const { supabase, userId } = context;
    for (const table of ["habit_logs", "habit_goals", "habits", "habit_routines", "habit_categories", "habit_celebrations"] as const) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw new Error("Couldn't delete your data. Please try again.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Couldn't delete your account. Please try again.");
    return { ok: true };
  });
