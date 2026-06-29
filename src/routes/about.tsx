import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Hindi Success Stories" },
      { name: "description", content: "Hindi Success Stories is a premium publishing platform for Hindi and English writers — focused on success, grit and entrepreneurship." },
      { property: "og:title", content: "About — Hindi Success Stories" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 prose-editorial">
        <h1 className="font-serif text-5xl mb-6">About HSS</h1>
        <p>Hindi Success Stories is a premium editorial platform for Indian writers — bringing the gravitas of print to the speed of the web.</p>
        <p>We publish founder profiles, success stories, deep essays and bilingual long-form journalism. Every author gets a portfolio page, contextual backlinks, and a real audience.</p>
        <h2>What we publish</h2>
        <ul><li>Founder & entrepreneur journeys</li><li>Long-form essays on growth & resilience</li><li>Interviews with leaders</li><li>Cultural and tech commentary</li></ul>
        <h2>Submit a story</h2>
        <p>Anyone with a free account can submit. Brands and agencies can use our <a href="/submit">guest post placements</a>.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});
