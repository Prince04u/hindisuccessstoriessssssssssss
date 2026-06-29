import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getArticleBySlug, toggleLike, addComment, toggleFollow } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => getArticleBySlug({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const a: any = loaderData;
    if (!a) return { meta: [{ title: "Story not found" }, { name: "robots", content: "noindex" }] };
    const title = a.meta_title || a.title;
    const desc = a.meta_description || a.excerpt || a.subtitle || "";
    return {
      meta: [
        { title: `${title} — HSS` },
        { name: "description", content: desc },
        { name: "author", content: a.author?.display_name ?? "HSS" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/article/${params.slug}` },
        ...(a.cover_image_url ? [{ property: "og:image", content: a.cover_image_url }, { name: "twitter:image", content: a.cover_image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "article:published_time", content: a.published_at ?? a.created_at },
      ],
      links: [{ rel: "canonical", href: a.canonical_url || `/article/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: desc,
          image: a.cover_image_url ? [a.cover_image_url] : undefined,
          datePublished: a.published_at,
          dateModified: a.published_at ?? a.created_at,
          author: a.author ? { "@type": "Person", name: a.author.display_name, url: `/author/${a.author.username}` } : undefined,
          publisher: { "@type": "Organization", name: "Hindi Success Stories" },
          mainEntityOfPage: { "@type": "WebPage", "@id": `/article/${params.slug}` },
        }),
      }],
    };
  },
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <NotFound />,
  component: ArticlePage,
});

function NotFound() {
  return <div className="min-h-screen flex flex-col"><SiteHeader /><div className="flex-1 grid place-items-center p-12 text-center"><div><h1 className="font-serif text-4xl mb-2">Story not found</h1><Link to="/" className="text-accent hover:underline">Back home</Link></div></div><SiteFooter /></div>;
}

function ArticlePage() {
  const a: any = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const like = useServerFn(toggleLike);
  const comment = useServerFn(addComment);
  const follow = useServerFn(toggleFollow);
  const [commentText, setCommentText] = useState("");

  const articleId = a?.id ?? "";
  const authorId = a?.author?.id ?? "";
  const likeM = useMutation({ mutationFn: () => like({ data: { article_id: articleId } }), onSuccess: () => qc.invalidateQueries() });
  const commentM = useMutation({ mutationFn: (content: string) => comment({ data: { article_id: articleId, content } }), onSuccess: () => { setCommentText(""); toast.success("Comment posted"); qc.invalidateQueries(); } });
  const followM = useMutation({ mutationFn: () => follow({ data: { user_id: authorId } }), onSuccess: () => toast.success("Updated") });

  if (!a) return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-ink/40 mb-6">
          <Link to="/" className="hover:text-accent">Home</Link>
          {a.category && <> / <Link to="/category/$slug" params={{ slug: a.category.slug }} className="hover:text-accent">{a.category.name}</Link></>}
        </nav>

        {a.category && <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-4">{a.category.name}</p>}
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] mb-6 text-balance">{a.title}</h1>
        {a.subtitle && <p className="text-xl md:text-2xl text-ink/60 italic font-serif mb-8">{a.subtitle}</p>}

        {/* Author header */}
        <div className="flex items-center justify-between border-y border-ink/5 py-5 mb-10">
          {a.author && (
            <Link to="/author/$username" params={{ username: a.author.username }} className="flex items-center gap-3 group/a">
              <div className="size-12 rounded-full bg-stone-200 overflow-hidden">{a.author.avatar_url && <img src={a.author.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
              <div>
                <p className="font-medium group-hover/a:text-accent">{a.author.display_name}</p>
                <p className="text-xs text-ink/40">{formatDistanceToNow(new Date(a.published_at ?? a.created_at), { addSuffix: true })} · {a.reading_time} min read</p>
              </div>
            </Link>
          )}
          {user && a.author && user.id !== a.author.id && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => followM.mutate()}>Follow</Button>
          )}
        </div>

        {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} className="w-full rounded-2xl mb-10 max-h-[500px] object-cover" />}

        <Markdown linkPolicy={a.link_policy as any}>{a.content}</Markdown>

        {a.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-ink/5">
            {a.tags.map((t: any) => (
              <span key={t.id} className="px-3 py-1.5 bg-ink/5 text-[11px] font-medium rounded-full">{t.name}</span>
            ))}
          </div>
        )}

        {/* Like / share */}
        <div className="flex items-center gap-3 py-6 border-y border-ink/5 my-12">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => user ? likeM.mutate() : navigate({ to: "/auth" })}>
            <Heart className="size-4" /> {a.like_count} Like
          </Button>
          <span className="flex items-center gap-1.5 text-sm text-ink/50"><MessageSquare className="size-4" /> {a.comment_count} comments</span>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="ml-auto flex items-center gap-1.5 text-sm text-ink/50 hover:text-accent"><Share2 className="size-4" /> Share</button>
        </div>

        {/* Author box (backlink contextual bio) */}
        {a.author && (
          <div className="border rounded-2xl p-6 my-12 bg-secondary/40">
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-full bg-stone-200 overflow-hidden shrink-0">{a.author.avatar_url && <img src={a.author.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-ink/40 mb-1">Written by</p>
                <Link to="/author/$username" params={{ username: a.author.username }} className="font-serif text-2xl hover:text-accent">{a.author.display_name}</Link>
                {a.author.bio && <p className="text-sm text-ink/70 mt-2">{a.author.bio}</p>}
                <div className="flex gap-3 mt-3 text-xs">
                  {a.author.website_url && <a href={a.author.website_url} target="_blank" rel={a.link_policy === "dofollow" ? "noopener" : "nofollow noopener"} className="text-accent hover:underline">Website</a>}
                  {a.author.twitter_handle && <a href={`https://twitter.com/${a.author.twitter_handle.replace("@","")}`} target="_blank" rel="nofollow noopener" className="text-accent hover:underline">Twitter</a>}
                  {a.author.linkedin_url && <a href={a.author.linkedin_url} target="_blank" rel="nofollow noopener" className="text-accent hover:underline">LinkedIn</a>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl mb-6">Discussion ({a.comments?.length ?? 0})</h2>
          {user ? (
            <form onSubmit={(e) => { e.preventDefault(); if (commentText.length >= 2) commentM.mutate(commentText); }} className="mb-8">
              <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} placeholder="Share your thoughts..." maxLength={2000} />
              <Button type="submit" disabled={commentM.isPending || commentText.length < 2} className="mt-3 rounded-full bg-ink hover:bg-accent">Post comment</Button>
            </form>
          ) : (
            <p className="text-sm text-ink/50 mb-8"><Link to="/auth" className="text-accent hover:underline">Sign in</Link> to comment.</p>
          )}
          <div className="space-y-6">
            {(a.comments ?? []).map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div className="size-9 rounded-full bg-stone-200 overflow-hidden shrink-0">{c.author?.avatar_url && <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1">
                  <div className="text-sm"><span className="font-medium">{c.author?.display_name}</span> <span className="text-xs text-ink/40">· {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span></div>
                  <p className="text-sm text-ink/80 mt-1">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}
