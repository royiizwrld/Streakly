import { toast } from "sonner";

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_ROOTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

/** True wherever a service worker must never run (dev, editor iframe, preview hosts, ?sw=off). */
export function isServiceWorkerBlocked(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0];
  if (PREVIEW_ROOTS.some((r) => host.endsWith(r)) && (PREVIEW_LABEL.test(label) || /^project--.+-dev$/.test(label))) return true;
  if (host === "id-preview--07e814d8-3bd1-4bf6-9802-51d7164bdf4a.lovable.app") return true;
  for (const root of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === root || host.endsWith(`.${root}`)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => (r.active ?? r.installing ?? r.waiting)?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
}

let started = false;
/** The single place the app's service worker is registered. */
export async function registerAppServiceWorker() {
  if (started || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  started = true;
  if (isServiceWorkerBlocked()) {
    await unregisterAppWorkers().catch(() => {});
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({
    immediate: true,
    // A new version has taken over; let the user choose when to reload.
    onNeedReload: () =>
      toast("Update available", {
        description: "A new version of Habit Tracker is ready.",
        duration: Infinity,
        action: { label: "Refresh", onClick: () => window.location.reload() },
      }),
  });
}
