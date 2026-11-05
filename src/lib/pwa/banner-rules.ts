export const DISMISS_DAYS = 14;
export const KEYS = { dismissedAt: "ht-install-dismissed-at", never: "ht-install-never", visits: "ht-visit-count" } as const;

export interface BannerInput {
  installable: boolean; // browser prompt available, or iOS Safari
  standalone: boolean;
  dismissedAt: number | null;
  never: boolean;
  visits: number;
  habitCount: number;
  now: number;
}

/** Whether the floating install banner should appear (signed-in app pages only). */
export function shouldShowInstallBanner(i: BannerInput): boolean {
  if (!i.installable || i.standalone || i.never) return false;
  if (i.dismissedAt && i.now - i.dismissedAt < DISMISS_DAYS * 86400000) return false;
  return i.visits >= 2 || i.habitCount >= 1;
}
