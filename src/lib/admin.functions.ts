import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const [{ count: usersCount }, { count: articlesCount }, { count: pendingCount }, { count: subsCount }] = await Promise.all([
      context.supabase.from("profiles").select("*", { count: "exact", head: true }),
      context.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      context.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("guest_post_submissions").select("*", { count: "exact", head: true }).neq("status", "rejected"),
    ]);
    const { data: recent } = await context.supabase.from("articles")
      .select("id, slug, title, status, created_at, author:profiles!articles_author_id_fkey(username, display_name)")
      .order("created_at", { ascending: false }).limit(10);
    return {
      stats: { users: usersCount ?? 0, articles: articlesCount ?? 0, pending: pendingCount ?? 0, submissions: subsCount ?? 0 },
      recent: recent ?? [],
    };
  });

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ status: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    let q: any = context.supabase.from("articles").select("id, slug, title, status, view_count, created_at, published_at, link_policy, is_featured, author:profiles!articles_author_id_fkey(username, display_name)").order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows } = await q.limit(100);
    return rows ?? [];
  });

export const adminUpdateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["draft", "pending", "published", "rejected", "archived"]).optional(),
    is_featured: z.boolean().optional(),
    link_policy: z.enum(["dofollow", "nofollow"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const update: Record<string, unknown> = {};
    if (data.status) update.status = data.status;
    if (typeof data.is_featured === "boolean") update.is_featured = data.is_featured;
    if (data.link_policy) update.link_policy = data.link_policy;
    const { error } = await (context.supabase.from("articles") as any).update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: profiles } = await context.supabase.from("profiles")
      .select("id, username, display_name, avatar_url, reputation, is_verified, created_at")
      .order("created_at", { ascending: false }).limit(200);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p: any) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
  });

export const adminToggleRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), role: z.enum(["admin","editor","author","reader"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase.from("user_roles").select("id").eq("user_id", data.user_id).eq("role", data.role).maybeSingle();
    if (existing) await context.supabase.from("user_roles").delete().eq("id", existing.id);
    else await context.supabase.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    return { ok: true };
  });

export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("guest_post_submissions")
      .select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminUpdateSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["pending_payment","paid_pending_review","approved","rejected","published"]).optional(), admin_notes: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const update: Record<string, unknown> = {};
    if (data.status) update.status = data.status;
    if (data.admin_notes !== undefined) update.admin_notes = data.admin_notes;
    const { error } = await (context.supabase.from("guest_post_submissions") as any).update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("comments")
      .select("id, content, is_hidden, created_at, article:articles(slug, title), author:profiles!comments_author_id_fkey(username, display_name)")
      .order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const adminToggleCommentHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), hidden: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    await context.supabase.from("comments").update({ is_hidden: data.hidden }).eq("id", data.id);
    return { ok: true };
  });
