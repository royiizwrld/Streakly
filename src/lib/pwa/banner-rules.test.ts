import { describe, expect, it } from "vitest";
import { shouldShowInstallBanner } from "./banner-rules";
import { detectIosSafari } from "@/context/InstallContext";

const base = { installable: true, standalone: false, dismissedAt: null, never: false, visits: 2, habitCount: 0, now: Date.UTC(2026, 0, 30) };
const day = 86400000;

describe("install banner rules", () => {
  it("shows on a second visit", () => expect(shouldShowInstallBanner(base)).toBe(true));
  it("shows after the first habit even on the first visit", () => expect(shouldShowInstallBanner({ ...base, visits: 1, habitCount: 1 })).toBe(true));
  it("hides on a first visit with no habits", () => expect(shouldShowInstallBanner({ ...base, visits: 1 })).toBe(false));
  it("hides for 14 days after Not now", () => {
    expect(shouldShowInstallBanner({ ...base, dismissedAt: base.now - 13 * day })).toBe(false);
    expect(shouldShowInstallBanner({ ...base, dismissedAt: base.now - 15 * day })).toBe(true);
  });
  it("hides when already installed or Don't ask again", () => {
    expect(shouldShowInstallBanner({ ...base, standalone: true })).toBe(false);
    expect(shouldShowInstallBanner({ ...base, never: true })).toBe(false);
  });
  it("detects iPhone Safari but not Chrome on iPhone", () => {
    expect(detectIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(detectIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});
