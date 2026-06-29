import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

type Article = {
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  reading_time?: number | null;
  published_at?: string | null;
  created_at?: string;
  category?: { slug: string; name: string } | null;
  author?: { username: string; display_name: string; avatar_url: string | null } | null;
};

export function ArticleCard({ a, variant = "row" }: { a: Article; variant?: "row" | "compact" }) {
  return (
    <article className="group grid grid-cols-1 md:grid-cols-3 gap-6">
      {a.cover_image_url && (
        <Link to="/article/$slug" params={{ slug: a.slug }} className="md:col-span-1 block">
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 outline-1 -outline-offset-1 outline-black/5 transition-transform group-hover:scale-[1.02]">
            <img src={a.cover_image_url} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
          </div>
        </Link>
      )}
      <div className={`${a.cover_image_url ? "md:col-span-2" : "md:col-span-3"} flex flex-col justify-center`}>
        {a.category && (
          <Link to="/category/$slug" params={{ slug: a.category.slug }} className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 hover:underline">
            {a.category.name}
          </Link>
        )}
        <Link to="/article/$slug" params={{ slug: a.slug }}>
          <h3 className="text-2xl font-serif font-bold mb-2 leading-snug group-hover:underline underline-offset-4 decoration-accent/30 text-balance">{a.title}</h3>
        </Link>
        {a.excerpt && <p className="text-ink/60 text-sm line-clamp-2 mb-3">{a.excerpt}</p>}
        <div className="flex items-center gap-2 text-xs text-ink/40">
          {a.author && (
            <Link to="/author/$username" params={{ username: a.author.username }} className="hover:text-accent">
              {a.author.display_name}
            </Link>
          )}
          <span>•</span>
          <span>{a.reading_time ?? 1} min read</span>
          {(a.published_at || a.created_at) && (
            <>
              <span>•</span>
              <time>{formatDistanceToNow(new Date(a.published_at ?? a.created_at!), { addSuffix: true })}</time>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
