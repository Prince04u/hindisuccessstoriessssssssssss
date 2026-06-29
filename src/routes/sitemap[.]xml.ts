import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry { path: string; lastmod?: string; changefreq?: string; priority?: string; }

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicClient } = await import("@/lib/supabase-public.server");
        const sb = publicClient();
        const [{ data: articles }, { data: categories }, { data: profiles }] = await Promise.all([
          sb.from("articles").select("slug, published_at, updated_at").eq("status", "published"),
          sb.from("categories").select("slug"),
          sb.from("profiles").select("username, updated_at"),
        ]);
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/submit", changefreq: "weekly", priority: "0.7" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          ...(categories ?? []).map((c: any) => ({ path: `/category/${c.slug}`, changefreq: "daily", priority: "0.7" })),
          ...(articles ?? []).map((a: any) => ({ path: `/article/${a.slug}`, lastmod: a.updated_at ?? a.published_at, changefreq: "weekly", priority: "0.8" })),
          ...(profiles ?? []).map((p: any) => ({ path: `/author/${p.username}`, lastmod: p.updated_at, changefreq: "weekly", priority: "0.5" })),
        ];
        const urls = entries.map((e) => [
          `  <url>`, `    <loc>${BASE_URL}${e.path}</loc>`,
          e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
          e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
          e.priority ? `    <priority>${e.priority}</priority>` : null,
          `  </url>`,
        ].filter(Boolean).join("\n"));
        const xml = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...urls, `</urlset>`].join("\n");
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
