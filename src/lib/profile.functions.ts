import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return { profile: data, roles: (roles ?? []).map((r: any) => r.role) };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    display_name: z.string().min(2).max(80),
    bio: z.string().max(500).optional().nullable(),
    avatar_url: z.string().url().optional().nullable().or(z.literal("")),
    website_url: z.string().url().optional().nullable().or(z.literal("")),
    twitter_handle: z.string().max(50).optional().nullable(),
    linkedin_url: z.string().url().optional().nullable().or(z.literal("")),
    github_url: z.string().url().optional().nullable().or(z.literal("")),
    location: z.string().max(100).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const clean: Record<string, unknown> = { ...data };
    Object.keys(clean).forEach((k) => clean[k] = clean[k] === "" ? null : clean[k]);
    const { error } = await (context.supabase.from("profiles") as any).update(clean).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
