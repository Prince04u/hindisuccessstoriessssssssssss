import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitGuestPost } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a guest post — Hindi Success Stories" },
      { name: "description", content: "Pitch us your story. Standard, featured and premium guest-post placements available with contextual backlinks." },
      { property: "og:title", content: "Submit a guest post — HSS" },
      { property: "og:description", content: "Pitch a guest post — standard, featured or premium placement with backlinks." },
      { property: "og:url", content: "/submit" },
    ],
    links: [{ rel: "canonical", href: "/submit" }],
  }),
  component: Submit,
});

const TIERS = [
  { id: "standard" as const, name: "Standard", price: 49, perks: ["1 dofollow author backlink", "Standard placement", "Published within 7 days"] },
  { id: "featured" as const, name: "Featured", price: 99, perks: ["Up to 2 contextual dofollow links", "Featured for 7 days", "Newsletter inclusion", "Published within 3 days"] },
  { id: "premium" as const, name: "Premium", price: 199, perks: ["Up to 3 contextual dofollow links", "Permanent featured tag", "Newsletter + social push", "Published within 24h"] },
];

function Submit() {
  const sub = useServerFn(submitGuestPost);
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<"standard"|"featured"|"premium">("featured");
  const [form, setForm] = useState({ name: "", email: "", website_url: "", proposed_title: "", pitch: "", draft_content: "" });

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <header className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-3">For Brands & Writers</p>
          <h1 className="font-serif text-5xl mb-4">Place a story on HSS</h1>
          <p className="text-lg text-ink/60 max-w-2xl mx-auto">Reach our audience of founders, creators and readers across India. All placements include contextual author backlinks.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {TIERS.map((t) => (
            <button type="button" key={t.id} onClick={() => setTier(t.id)}
              className={`text-left rounded-2xl border-2 p-6 transition-all ${tier === t.id ? "border-accent bg-accent/5" : "border-ink/10 hover:border-ink/30"}`}>
              <div className="text-sm font-bold uppercase tracking-widest mb-2">{t.name}</div>
              <div className="font-serif text-4xl mb-4">${t.price}</div>
              <ul className="space-y-1.5 text-sm text-ink/70">
                {t.perks.map((p) => <li key={p} className="flex gap-2"><Check className="size-4 text-accent shrink-0 mt-0.5" /> {p}</li>)}
              </ul>
            </button>
          ))}
        </div>

        <form onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await sub({ data: { ...form, tier } });
              toast.success("Pitch submitted! We'll email you a payment link shortly.");
              setForm({ name: "", email: "", website_url: "", proposed_title: "", pitch: "", draft_content: "" });
            } catch (err: any) { toast.error(err?.message ?? "Failed"); }
            finally { setBusy(false); }
          }}
          className="border rounded-2xl p-8 space-y-5 bg-card">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label className="mb-1.5 block">Your name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="mb-1.5 block">Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><Label className="mb-1.5 block">Website (optional)</Label><Input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://yourbrand.com" /></div>
          <div><Label className="mb-1.5 block">Proposed title</Label><Input required value={form.proposed_title} onChange={(e) => setForm({ ...form, proposed_title: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Pitch (min 20 chars)</Label><Textarea required minLength={20} rows={4} value={form.pitch} onChange={(e) => setForm({ ...form, pitch: e.target.value })} placeholder="What's the angle, who is it for, why now?" /></div>
          <div><Label className="mb-1.5 block">Draft content (optional, markdown)</Label><Textarea rows={6} value={form.draft_content} onChange={(e) => setForm({ ...form, draft_content: e.target.value })} /></div>
          <Button type="submit" disabled={busy} className="w-full rounded-full bg-ink hover:bg-accent">Submit {TIERS.find(t=>t.id===tier)?.name} pitch (${TIERS.find(t=>t.id===tier)?.price})</Button>
          <p className="text-xs text-ink/50 text-center">Payment processing will be enabled by an admin. No charge yet.</p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
