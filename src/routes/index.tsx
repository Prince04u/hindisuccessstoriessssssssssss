import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listHomeArticles } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";
import { NewsletterCard } from "@/components/newsletter-card";

const homeQO = queryOptions({ queryKey: ["home"], queryFn: () => listHomeArticles() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hindi Success Stories — Where Ideas Find Their Voice" },
      { name: "description", content: "A premium publishing platform for Hindi and English writers. Read success stories, interviews, essays and entrepreneurial journeys." },
      { property: "og:title", content: "Hindi Success Stories — Premium Publishing Platform" },
      { property: "og:description", content: "Read and publish success stories, interviews and essays from India's most thoughtful voices." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQO),
  component: Home,
  errorComponent: () => <div className="p-10 text-center">Failed to load.</div>,
  notFoundComponent: () => <div className="p-10 text-center">Not found</div>,
});

function Home() {
  const { data } = useSuspenseQuery(homeQO);
  const featured: any = data.featured;
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-6 w-full flex-1">
        {/* Hero */}
        {featured ? (
          <section className="py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-ink/5">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider rounded-sm">Featured</span>
                <span className="text-ink/40 text-xs">{featured.reading_time ?? 1} min read{featured.category && ` • ${featured.category.name}`}</span>
              </div>
              <Link to="/article/$slug" params={{ slug: featured.slug }}>
                <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-8 hover:text-accent transition-colors text-balance">
                  {featured.title}
                </h1>
              </Link>
              {featured.excerpt && <p className="text-xl text-ink/70 leading-relaxed mb-8 max-w-xl">{featured.excerpt}</p>}
              {featured.author && (
                <Link to="/author/$username" params={{ username: featured.author.username }} className="flex items-center gap-4 group/a">
                  <div className="size-12 rounded-full bg-stone-200 outline-1 -outline-offset-1 outline-black/5 overflow-hidden">
                    {featured.author.avatar_url && <img src={featured.author.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-medium group-hover/a:text-accent">{featured.author.display_name}</p>
                    <p className="text-xs text-ink/40">@{featured.author.username}</p>
                  </div>
                </Link>
              )}
            </div>
            <div className="lg:col-span-5">
              <Link to="/article/$slug" params={{ slug: featured.slug }}>
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 outline-1 -outline-offset-1 outline-black/5">
                  {featured.cover_image_url ? (
                    <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center font-serif text-7xl text-ink/10">HSS</div>
                  )}
                </div>
              </Link>
            </div>
          </section>
        ) : (
          <section className="py-20 text-center border-b border-ink/5">
            <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-6">Where ideas find their <span className="italic">voice</span></h1>
            <p className="text-xl text-ink/60 max-w-2xl mx-auto mb-8">A premium space for Hindi and English writers to share profound narratives.</p>
            <Link to="/auth" className="inline-block bg-ink text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">Start writing</Link>
          </section>
        )}

        {/* Trending */}
        {data.trending.length > 0 && (
          <section className="py-16">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/30">Trending on HSS</h2>
              <div className="h-px flex-1 mx-8 bg-ink/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
              {data.trending.slice(0, 6).map((a: any, i: number) => (
                <Link key={a.id} to="/article/$slug" params={{ slug: a.slug }} className="flex gap-6 group cursor-pointer">
                  <span className="text-4xl font-serif text-ink/10 group-hover:text-accent/30 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-serif text-xl leading-tight mb-3 group-hover:text-accent transition-colors text-balance">{a.title}</h3>
                    <div className="text-xs text-ink/40 flex gap-2">
                      <span>{a.author?.display_name}</span>
                      <span>•</span>
                      <span>{a.reading_time ?? 1} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        <section className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-ink/5">
          <div className="lg:col-span-8">
            <h2 className="text-xl font-serif italic mb-8 border-b border-ink/5 pb-4">Latest Narratives</h2>
            <div className="space-y-16">
              {data.latest.length === 0 ? (
                <p className="text-ink/50">No articles published yet. <Link to="/auth" className="text-accent underline">Be the first to write</Link>.</p>
              ) : data.latest.map((a: any) => <ArticleCard key={a.id} a={a} />)}
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-12">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-ink/40">Top Contributors</h4>
                <div className="space-y-4">
                  {data.topAuthors.map((p: any) => (
                    <Link to="/author/$username" params={{ username: p.username }} key={p.id} className="flex items-center gap-3 group/a">
                      <div className="size-10 rounded-full bg-stone-200 overflow-hidden">
                        {p.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold group-hover/a:text-accent">{p.display_name}</p>
                        <p className="text-[10px] text-ink/40">{p.bio?.slice(0, 40) || "Writer"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-ink/40">Discover More</h4>
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((c: any) => (
                    <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="px-3 py-1.5 bg-ink/5 text-[11px] font-medium rounded-full hover:bg-ink/10 transition-colors">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
              <NewsletterCard />
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
