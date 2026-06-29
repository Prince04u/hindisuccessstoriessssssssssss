import { createFileRoute, notFound } from "@tanstack/react-router";
import { listByAuthor } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";

export const Route = createFileRoute("/author/$username")({
  loader: async ({ params }) => {
    const r = await listByAuthor({ data: { username: params.username } });
    if (!r) throw notFound();
    return r;
  },
  head: ({ params, loaderData }) => {
    const p: any = loaderData?.profile;
    const title = p ? `${p.display_name} (@${p.username}) — HSS` : "Author";
    const desc = p?.bio || `Articles by ${p?.display_name} on Hindi Success Stories.`;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "profile" }, { property: "og:url", content: `/author/${params.username}` },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/author/${params.username}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "ProfilePage",
          mainEntity: { "@type": "Person", name: p?.display_name, url: p?.website_url, sameAs: [p?.twitter_handle && `https://twitter.com/${p.twitter_handle.replace("@","")}`, p?.linkedin_url, p?.github_url].filter(Boolean) },
        }),
      }],
    };
  },
  notFoundComponent: () => <div className="min-h-screen grid place-items-center p-12"><p>Author not found</p></div>,
  errorComponent: () => <div className="min-h-screen grid place-items-center p-12"><p>Failed to load author</p></div>,
  component: AuthorPage,
});

function AuthorPage() {
  const { profile, articles } = Route.useLoaderData() as any;
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <header className="text-center mb-16 pb-12 border-b border-ink/5">
          <div className="size-24 rounded-full bg-stone-200 mx-auto mb-5 overflow-hidden">{profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
          <h1 className="font-serif text-4xl mb-1">{profile.display_name}</h1>
          <p className="text-ink/40 text-sm mb-4">@{profile.username}{profile.location && ` · ${profile.location}`}</p>
          {profile.bio && <p className="text-lg text-ink/70 max-w-xl mx-auto mb-5">{profile.bio}</p>}
          <div className="flex gap-4 justify-center text-sm">
            {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener nofollow" className="text-accent hover:underline">Website</a>}
            {profile.twitter_handle && <a href={`https://twitter.com/${profile.twitter_handle.replace("@","")}`} target="_blank" rel="noopener nofollow" className="text-accent hover:underline">Twitter</a>}
            {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener nofollow" className="text-accent hover:underline">LinkedIn</a>}
            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener nofollow" className="text-accent hover:underline">GitHub</a>}
          </div>
        </header>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-8">{articles.length} {articles.length === 1 ? "Story" : "Stories"}</h2>
        <div className="space-y-12">
          {articles.length === 0 ? <p className="text-ink/50">No published stories yet.</p> :
            articles.map((a: any) => <ArticleCard key={a.id} a={a} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
