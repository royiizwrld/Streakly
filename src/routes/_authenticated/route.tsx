import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HabitsProvider } from "@/context/HabitsContext";
import { AppShell } from "@/components/AppShell";
import { DataGate, ImportPrompt, ProfilePrefsSync } from "@/components/AppStatus";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { endDemoMode, isDemoMode } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated")({
  // Session lives in localStorage, which SSR cannot read — gate on the client.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    let user = data.user;
    // Offline the server can't confirm the session; trust the one saved on this device.
    if (!user && (navigator.onLine === false || error?.name === "AuthRetryableFetchError")) {
      user = (await supabase.auth.getSession()).data.session?.user ?? null;
    }
    if (user) endDemoMode();
    if (!user && !isDemoMode()) {
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
