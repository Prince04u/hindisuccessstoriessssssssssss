import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Columns for list views (NO embeds — joins fail on Cloudflare Workers' supabase client)
const ARTICLE_LIST_COLS = `
  id, slug, title, subtitle, excerpt, cover_image_url, status, reading_time,
  view_count, like_count, comment_count, published_at, created_at, is_featured,
  category_id, author_id
`;

// Helper: attach category + author to a list of articles via separate queries
async function attachMeta(sb: any, rows: any[]) {
  if (!rows || rows.length === 0) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id).filter(Boolean))];
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))];

  const [{ data: authors }, { data: categories }] = await Promise.all([
    authorIds.length
      ? sb.from("profiles").select("id, username, display_name, avatar_url, bio").in("id", authorIds)
      : Promise.resolve({ data: [] }),
    categoryIds.length
      ? sb.from("categories").select("id, slug, name").in("id", categoryIds)
      : Promise.resolve({ data: [] }),
  ]);

  const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));
  const categoryMap = new Map((categories ?? []).map((c: any) => [c.id, c]));

  return rows.map((r) => ({
    ...r,
    author: authorMap.get(r.author_id) ?? null,
    category: categoryMap.get(r.category_id) ?? null,
  }));
}

export const listHomeArticles = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();

    const [{ data: featuredRows }, { data: latestRows }, { data: trendingRows }, { data: categories }, { data: authors }] =
      await Promise.all([
        sb.from("articles").select(ARTICLE_LIST_COLS).eq("status", "published").eq("is_featured", true).order("published_at", { ascending: false }).limit(1),
        sb.from("articles").select(ARTICLE_LIST_COLS).eq("status", "published").order("published_at", { ascending: false }).limit(12),
        sb.from("articles").select(ARTICLE_LIST_COLS).eq("status", "published").order("view_count", { ascending: false }).limit(6),
        sb.from("categories").select("id, slug, name").limit(20),
        sb.from("profiles").select("id, username, display_name, avatar_url, bio, reputation").order("reputation", { ascending: false }).limit(6),
      ]);

    const [featured, latest, trending] = await Promise.all([
      attachMeta(sb, featuredRows ?? []),
      attachMeta(sb, latestRows ?? []),
      attachMeta(sb, trendingRows ?? []),
    ]);

    return {
      featured: featured[0] ?? null,
      latest,
      trending,
      categories: categories ?? [],
      topAuthors: authors ?? [],
    };
  } catch (err) {
    console.error("HOME ERROR:", err);
    throw err;
  }
});

export const getArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();

    // 1. Article (no embeds)
    const { data: article } = await sb.from("articles").select(`
      id, slug, title, subtitle, excerpt, content, cover_image_url, status,
      meta_title, meta_description, canonical_url, og_image_url, link_policy,
      reading_time, view_count, like_count, comment_count, published_at, created_at, is_sponsored,
      category_id, author_id
    `).eq("slug", data.slug).eq("status", "published").maybeSingle();
    if (!article) return null;

    // 2. Author + category + tags + comments separately
    const [{ data: author }, { data: category }, { data: tags }, { data: comments }] = await Promise.all([
      article.author_id
        ? sb.from("profiles").select("id, username, display_name, avatar_url, bio, website_url, twitter_handle, linkedin_url").eq("id", article.author_id).maybeSingle()
        : Promise.resolve({ data: null }),
      article.category_id
        ? sb.from("categories").select("id, slug, name").eq("id", article.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      sb.from("article_tags").select("tag:tags(id, slug, name)").eq("article_id", article.id),
      sb.from("comments").select("id, content, created_at, author_id").eq("article_id", article.id).eq("is_hidden", false).order("created_at", { ascending: false }),
    ]);

    // 3. Comment authors
    let commentsWithAuthors: any[] = comments ?? [];
    if (comments && comments.length > 0) {
      const cAuthorIds = [...new Set(comments.map((c: any) => c.author_id).filter(Boolean))];
      const { data: cAuthors } = await sb.from("profiles").select("id, username, display_name, avatar_url").in("id", cAuthorIds);
      const cMap = new Map((cAuthors ?? []).map((p: any) => [p.id, p]));
      commentsWithAuthors = comments.map((c: any) => ({ ...c, author: cMap.get(c.author_id) ?? null }));
    }

    // 4. View count (fire-and-forget-ish)
    await sb.from("article_views").insert({ article_id: article.id });
    await sb.from("articles").update({ view_count: (article.view_count ?? 0) + 1 }).eq("id", article.id);

    // 5. Merge
    return {
      ...article,
      author: author ?? null,
      category: category ?? null,
      tags: tags?.map((t: any) => t.tag) ?? [],
      comments: commentsWithAuthors,
    };
  });

export const listByCategory = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();
    const { data: category } = await sb.from("categories").select("*").eq("slug", data.slug).maybeSingle();
    if (!category) return null;
    const { data: rows } = await sb.from("articles").select(ARTICLE_LIST_COLS).eq("status", "published").eq("category_id", category.id).order("published_at", { ascending: false }).limit(30);
    const articles = await attachMeta(sb, rows ?? []);
    return { category, articles };
  });

export const listByAuthor = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ username: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();
    const { data: profile } = await sb.from("profiles").select("*").eq("username", data.username).maybeSingle();
    if (!profile) return null;
    const { data: rows } = await sb.from("articles").select(ARTICLE_LIST_COLS).eq("status", "published").eq("author_id", profile.id).order("published_at", { ascending: false });
    const articles = await attachMeta(sb, rows ?? []);
    return { profile, articles };
  });

// ===== Authenticated mutations =====

const articleSaveSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(3).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().default(""),
  cover_image_url: z.string().url().optional().nullable().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().max(70).optional().nullable(),
  meta_description: z.string().max(180).optional().nullable(),
  canonical_url: z.string().url().optional().nullable().or(z.literal("")),
  submit: z.boolean().default(false),
});

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => articleSaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const status: "draft" | "pending" = data.submit ? "pending" : "draft";
    const payload = {
      author_id: userId,
      title: data.title,
      subtitle: data.subtitle || null,
      excerpt: data.excerpt || null,
      content: data.content,
      cover_image_url: data.cover_image_url || null,
      category_id: data.category_id || null,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      canonical_url: data.canonical_url || null,
      status,
    };
    let id = data.id;
    if (id) {
      const { error } = await (supabase.from("articles") as any).update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await (supabase.from("articles") as any).insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      id = row.id;
    }
    // Tags
    if (data.tags.length) {
      const tagIds: string[] = [];
      for (const name of data.tags) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!slug) continue;
        const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
        if (existing) tagIds.push(existing.id);
        else {
          const { data: created } = await supabase.from("tags").insert({ slug, name }).select("id").single();
          if (created) tagIds.push(created.id);
        }
      }
      await supabase.from("article_tags").delete().eq("article_id", id!);
      if (tagIds.length) await supabase.from("article_tags").insert(tagIds.map((t) => ({ article_id: id!, tag_id: t })));
    }
    return { id };
  });

export const getMyArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: article } = await context.supabase
      .from("articles").select("*, article_tags(tag:tags(name))").eq("id", data.id).maybeSingle();
    return article;
  });

export const listMyArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("articles").select("id, title, status, view_count, like_count, comment_count, created_at, published_at, slug")
      .eq("author_id", context.userId).order("created_at", { ascending: false });
    return data ?? [];
  });

export const deleteMyArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Social actions =====

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ article_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("likes").select("article_id").eq("user_id", context.userId).eq("article_id", data.article_id).maybeSingle();
    if (existing) {
      await context.supabase.from("likes").delete().eq("user_id", context.userId).eq("article_id", data.article_id);
      return { liked: false };
    }
    await context.supabase.from("likes").insert({ user_id: context.userId, article_id: data.article_id });
    return { liked: true };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ article_id: z.string().uuid(), content: z.string().min(2).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("comments").insert({ article_id: data.article_id, author_id: context.userId, content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("Cannot follow yourself");
    const { data: existing } = await context.supabase.from("follows").select("follower_id").eq("follower_id", context.userId).eq("following_id", data.user_id).maybeSingle();
    if (existing) {
      await context.supabase.from("follows").delete().eq("follower_id", context.userId).eq("following_id", data.user_id);
      return { following: false };
    }
    await context.supabase.from("follows").insert({ follower_id: context.userId, following_id: data.user_id });
    return { following: true };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();
    const { error } = await sb.from("newsletter_subscribers").insert({ email: data.email.toLowerCase() });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const submitGuestPost = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    website_url: z.string().url().optional().or(z.literal("")),
    proposed_title: z.string().min(5).max(200),
    pitch: z.string().min(20).max(2000),
    draft_content: z.string().optional(),
    tier: z.enum(["standard", "featured", "premium"]).default("standard"),
  }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./supabase-public.server");
    const sb = publicClient();
    const price = data.tier === "premium" ? 19900 : data.tier === "featured" ? 9900 : 4900;
    const { data: row, error } = await sb.from("guest_post_submissions").insert({
      name: data.name, email: data.email, website_url: data.website_url || null,
      proposed_title: data.proposed_title, pitch: data.pitch, draft_content: data.draft_content || null,
      tier: data.tier, price_cents: price,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
