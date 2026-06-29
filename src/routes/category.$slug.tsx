import { createFileRoute, notFound } from "@tanstack/react-router";
import { listByCategory } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const r = await listByCategory({ data: { slug: params.slug } });
    if (!r) throw notFound();
    return r;
  },
  head: ({ params, loaderData }) => {
    const c: any = loaderData?.category;
    const title = c ? `${c.name} — HSS` : "Category";
    const desc = c?.description || `Articles in ${c?.name} on Hindi Success Stories.`;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:url", content: `/category/${params.slug}` }, { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `/category/${params.slug}` }],
    };
  },
  notFoundComponent: () => <div className="min-h-screen grid place-items-center p-12"><p>Category not found</p></div>,
  errorComponent: () => <div className="min-h-screen grid place-items-center p-12"><p>Failed to load</p></div>,
  component: CategoryPage,
});

function CategoryPage() {
  const { category, articles } = Route.useLoaderData() as any;
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <header className="mb-12 pb-8 border-b border-ink/5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">Category</p>
          <h1 className="font-serif text-5xl mb-3">{category.name}</h1>
          {category.description && <p className="text-lg text-ink/60">{category.description}</p>}
        </header>
        <div className="space-y-12">
          {articles.length === 0 ? <p className="text-ink/50">No stories in this category yet.</p> :
            articles.map((a: any) => <ArticleCard key={a.id} a={a} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
