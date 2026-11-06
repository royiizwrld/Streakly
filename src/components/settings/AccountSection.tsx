import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useInstall } from "@/context/InstallContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IosInstallDialog } from "@/components/pwa/IosInstallDialog";
import { deleteMyAccount } from "@/lib/account.functions";
import { removeStored, writeStored } from "@/lib/browser-storage";
import { clearThreads } from "@/lib/coach-history";
import { KEYS } from "@/lib/pwa/banner-rules";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ProfileHeader() {
  const { user, profile } = useAuth();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  return (
    <div className="rounded-3xl bg-hero p-5 text-primary-foreground">
      <p className="font-display text-2xl font-extrabold">{name || "Your account"}</p>
      <p className="text-sm opacity-90">{user?.email}</p>
    </div>
  );
}

export function AccountSections() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const install = useInstall();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const deleteFn = useServerFn(deleteMyAccount);

  useEffect(() => {
    setFirst(profile?.first_name ?? "");
    setLast(profile?.last_name ?? "");
  }, [profile?.first_name, profile?.last_name]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !first.trim()) return toast.error("First name is required.");
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ first_name: first.trim().slice(0, 60), last_name: last.trim().slice(0, 60) || null }).eq("id", user.id);
    setSavingName(false);
    if (error) return toast.error("Couldn't save your name. Please try again.");
    await refreshProfile();
    toast.success("Name updated");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pw.length < 8) return setPwError("Password must be at least 8 characters.");
    if (pw !== pw2) return setPwError("Passwords don't match.");
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) return setPwError(/same/i.test(error.message) ? "Choose a password different from your current one." : "Couldn't change your password. Please try again.");
    setPw("");
    setPw2("");
    toast.success("Password changed");
  };

  const logout = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteFn({ data: { confirm } });
      clearThreads();
      removeStored("ht-coach-chat");
      await supabase.auth.signOut().catch(() => {});
      toast.success("Your account and data were deleted");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete your account.");
      setDeleting(false);
    }
  };

  const onInstall = async () => {
    if (install.isStandalone) return;
    if (install.canPrompt) {
      const outcome = await install.promptInstall();
      if (outcome === "accepted") {
        writeStored(KEYS.never, "1");
        toast.success("Thanks for installing Habit Tracker!");
      }
      return;
    }
    if (install.isIosSafari) return setIosOpen(true);
    toast("Use your browser menu to install", { description: "Look for “Install app” or “Add to Home Screen” in the browser's menu." });
  };

  return (
    <>
      <Card title="Profile">
        <form onSubmit={saveName} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="first">First name</Label><Input id="first" value={first} onChange={(e) => setFirst(e.target.value)} required maxLength={60} /></div>
          <div className="space-y-1.5"><Label htmlFor="last">Last name (optional)</Label><Input id="last" value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={savingName}>{savingName && <Loader2 className="animate-spin" />} Save name</Button></div>
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={savePassword} className="grid gap-3 sm:grid-cols-2" noValidate>
          <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pw2">Confirm new password</Label><Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          {pwError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{pwError}</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={savingPw}>{savingPw && <Loader2 className="animate-spin" />} Update password</Button></div>
        </form>
      </Card>

      <Card title="Install app">
        {install.isStandalone ? (
          <p className="text-sm text-muted-foreground">App installed — you're using Habit Tracker from your home screen.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Add Habit Tracker to your home screen for one-tap check-ins.</p>
            <Button variant="secondary" onClick={onInstall}><Download /> Install app</Button>
          </>
        )}
      </Card>

      <Card title="Account">
        <p className="text-sm text-muted-foreground">
          Read our <Link to="/terms" className="font-medium text-primary underline-offset-2 hover:underline">Terms and Conditions</Link> and{" "}
          <Link to="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={logout}><LogOut /> Log out</Button>
          <Button variant="outline" className="text-destructive" onClick={() => { setConfirm(""); setDelOpen(true); }}><Trash2 /> Delete account and all data</Button>
        </div>
      </Card>

      <Dialog open={delOpen} onOpenChange={(o) => !deleting && setDelOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This permanently removes your account, habits, check-ins, notes and goals. It can't be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
            <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" disabled={confirm !== "DELETE" || deleting} onClick={doDelete}>{deleting && <Loader2 className="animate-spin" />} Delete forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  );
}
