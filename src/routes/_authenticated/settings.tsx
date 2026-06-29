import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — HSS" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

function Settings() {
  const get = useServerFn(getMyProfile);
  const upd = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => get() });
  const p = data?.profile as any;

  const [form, setForm] = useState({
    display_name: "", bio: "", avatar_url: "", website_url: "",
    twitter_handle: "", linkedin_url: "", github_url: "", location: "",
  });

  useEffect(() => { if (p) setForm({
    display_name: p.display_name ?? "", bio: p.bio ?? "", avatar_url: p.avatar_url ?? "",
    website_url: p.website_url ?? "", twitter_handle: p.twitter_handle ?? "",
    linkedin_url: p.linkedin_url ?? "", github_url: p.github_url ?? "", location: p.location ?? "",
  }); }, [p?.id]);

  const m = useMutation({
    mutationFn: (data: typeof form) => upd({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-profile"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <h1 className="font-serif text-4xl mb-1">Profile settings</h1>
        <p className="text-ink/50 mb-8 text-sm">Your bio and links appear under every article you publish.</p>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); m.mutate(form); }}>
          <div><Label className="mb-1.5 block">Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required /></div>
          <div><Label className="mb-1.5 block">Username <span className="text-xs text-ink/40">(can't change)</span></Label><Input value={p?.username ?? ""} readOnly disabled /></div>
          <div><Label className="mb-1.5 block">Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={500} /></div>
          <div><Label className="mb-1.5 block">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label className="mb-1.5 block">Website</Label><Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label className="mb-1.5 block">Twitter handle</Label><Input value={form.twitter_handle} onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })} placeholder="@you" /></div>
            <div><Label className="mb-1.5 block">LinkedIn</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
            <div><Label className="mb-1.5 block">GitHub</Label><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." /></div>
          </div>
          <Button type="submit" disabled={m.isPending} className="rounded-full bg-ink hover:bg-accent">Save changes</Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
