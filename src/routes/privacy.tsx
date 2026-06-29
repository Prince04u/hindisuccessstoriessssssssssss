import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — HSS" }, { name: "description", content: "How we handle your data on Hindi Success Stories." }, { property: "og:url", content: "/privacy" }],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 prose-editorial">
        <h1 className="font-serif text-5xl mb-6">Privacy Policy</h1>
        <p>We collect only what's needed to operate the platform — account info, article content, and basic usage analytics. We never sell your data.</p>
        <p>You can delete your account at any time from settings.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});
