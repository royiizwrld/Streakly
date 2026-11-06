import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HabitsProvider } from "@/context/HabitsContext";
import { AppShell } from "@/components/AppShell";
import { DataGate, ImportPrompt, ProfilePrefsSync } from "@/components/AppStatus";
import { InstallBanner } from "@/components/pwa/InstallBanner";

export const Route = createFileRoute("/_authenticated")({
  // Session lives in localStorage, which SSR cannot read — gate on the client.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <HabitsProvider>
      <ProfilePrefsSync />
      <AppShell>
        <DataGate>
          <Outlet />
        </DataGate>
      </AppShell>
      <ImportPrompt />
      <InstallBanner />
    </HabitsProvider>
  );
}
