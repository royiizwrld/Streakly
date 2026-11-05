import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { registerAppServiceWorker } from "@/lib/pwa/register";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallCtx {
  /** Browser offered an install prompt we can trigger. */
  canPrompt: boolean;
  isStandalone: boolean;
  isIosSafari: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const Ctx = createContext<InstallCtx | null>(null);

export function detectIosSafari(ua: string, maxTouchPoints = 0) {
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  return ios && /Safari/.test(ua) && !otherBrowser;
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setStandalone] = useState(false);
  const [isIosSafari, setIos] = useState(false);

  useEffect(() => {
    const standalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(standalone());
    setIos(detectIosSafari(navigator.userAgent, navigator.maxTouchPoints));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    void registerAppServiceWorker();
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return (
    <Ctx.Provider value={{ canPrompt: !!deferred, isStandalone, isIosSafari, promptInstall }}>{children}</Ctx.Provider>
  );
}

export function useInstall() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInstall must be used inside InstallProvider");
  return v;
}
