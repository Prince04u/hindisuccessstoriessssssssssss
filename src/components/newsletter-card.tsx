import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/articles.functions";
import { toast } from "sonner";

export function NewsletterCard() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="bg-ink text-paper p-8 rounded-2xl">
      <h4 className="font-serif text-2xl mb-3 text-white">The Success Brief</h4>
      <p className="text-white/60 text-sm mb-5">Weekly insights on growth, grit and ground realities of Indian success stories.</p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) return;
          setBusy(true);
          try { await subscribe({ data: { email } }); toast.success("Subscribed!"); setEmail(""); }
          catch (err: any) { toast.error(err?.message ?? "Failed"); }
          finally { setBusy(false); }
        }}
      >
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
        />
        <button disabled={busy} className="w-full bg-accent text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50">
          {busy ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
