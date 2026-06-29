import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Hindi Success Stories" },
      { name: "description", content: "Sign in or create a free account to read and publish stories on Hindi Success Stories." },
      { property: "og:title", content: "Sign in — Hindi Success Stories" },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName || email.split("@")[0] }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (res.error) throw res.error;
      if (res.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl mb-2">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-ink/50">{mode === "signin" ? "Sign in to read, write and follow." : "Start publishing in under a minute."}</p>
          </div>

          <Button onClick={google} disabled={busy} variant="outline" className="w-full rounded-full mb-4">
            <svg className="size-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.5 2.45-2.65 3.85-5.35 3.85-3.2 0-5.85-2.65-5.85-5.85S8.8 6.45 12 6.45c1.45 0 2.75.55 3.75 1.45l2.4-2.4C16.55 3.9 14.4 3 12 3 7.05 3 3 7.05 3 12s4.05 9 9 9c5.2 0 8.65-3.6 8.65-8.65 0-.45-.05-.85-.15-1.25z"/></svg>
            Continue with Google
          </Button>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-ink/10" /></div><div className="relative flex justify-center text-xs"><span className="bg-paper px-3 text-ink/40 uppercase tracking-widest">Or with email</span></div></div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div><Label className="mb-1.5 block">Display name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></div>
            )}
            <div><Label className="mb-1.5 block">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label className="mb-1.5 block">Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full rounded-full bg-ink hover:bg-accent">
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-ink/50 mt-6">
            {mode === "signin" ? "New here?" : "Have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-accent hover:underline font-medium">
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
          <p className="text-center text-xs text-ink/40 mt-4"><Link to="/" className="hover:text-accent">← Back to home</Link></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
