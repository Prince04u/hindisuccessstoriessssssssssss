import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms — HSS" }, { name: "description", content: "Terms of use for Hindi Success Stories." }, { property: "og:url", content: "/terms" }],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 prose-editorial">
        <h1 className="font-serif text-5xl mb-6">Terms of Service</h1>
        <p>By using HSS you agree to publish original content, respect copyright, and avoid spammy or harmful material. Editors may reject submissions at their discretion.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});
