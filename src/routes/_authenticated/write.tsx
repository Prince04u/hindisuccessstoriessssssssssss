import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { saveArticle, getMyArticle } from "@/lib/articles.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/write")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => ({ meta: [{ title: "Write a story — HSS" }, { name: "robots", content: "noindex" }] }),
  component: WritePage,
});

function WritePage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const save = useServerFn(saveArticle);
  const getMine = useServerFn(getMyArticle);

  const [articleId, setArticleId] = useState<string | undefined>(id);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagsText, setTagsText] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [canonical, setCanonical] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name").order("name").then(({ data }) => setCategories((data as any) ?? []));
    if (id) getMine({ data: { id } }).then((a: any) => {
      if (!a) return;
      setTitle(a.title); setSubtitle(a.subtitle ?? ""); setExcerpt(a.excerpt ?? "");
      setContent(a.content ?? ""); setCover(a.cover_image_url ?? "");
      setCategoryId(a.category_id ?? ""); setMetaTitle(a.meta_title ?? "");
      setMetaDesc(a.meta_description ?? ""); setCanonical(a.canonical_url ?? "");
      setTagsText((a.article_tags ?? []).map((t: any) => t.tag.name).join(", "));
    });
  }, [id]);

  async function submit(asSubmit: boolean) {
    if (title.length < 3) { toast.error("Title required (min 3 chars)"); return; }
    setBusy(true);
    try {
      const res = await save({ data: {
        id: articleId ?? null, title, subtitle, excerpt, content,
        cover_image_url: cover, category_id: categoryId || null,
        tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        meta_title: metaTitle, meta_description: metaDesc, canonical_url: canonical,
        submit: asSubmit,
      }});
      setArticleId(res.id ?? undefined);
      toast.success(asSubmit ? "Submitted for review!" : "Draft saved.");
      if (asSubmit) navigate({ to: "/dashboard" });
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl">{articleId ? "Edit story" : "Write a new story"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => submit(false)} disabled={busy} className="rounded-full">Save draft</Button>
            <Button onClick={() => submit(true)} disabled={busy} className="rounded-full bg-ink hover:bg-accent">Submit for review</Button>
          </div>
        </div>

        <Tabs defaultValue="write" className="w-full">
          <TabsList><TabsTrigger value="write">Write</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger></TabsList>

          <TabsContent value="write" className="space-y-6 mt-6">
            <Input className="!text-4xl font-serif font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0" placeholder="Headline that earns attention" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            <Input className="!text-xl font-serif italic border-0 border-b rounded-none focus-visible:ring-0 px-0" placeholder="Optional subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={300} />
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label className="mb-1.5 block">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="mb-1.5 block">Tags (comma separated)</Label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="entrepreneurship, india, growth" /></div>
            </div>
            <div><Label className="mb-1.5 block">Cover image URL</Label>
              <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." />
              {cover && <img src={cover} alt="" className="mt-3 max-h-64 rounded-lg" />}</div>
            <div><Label className="mb-1.5 block">Excerpt (shows on cards)</Label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={500} /></div>
            <div><Label className="mb-1.5 block">Body (Markdown supported)</Label>
              <Textarea className="font-serif text-lg leading-relaxed min-h-[500px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="# Start your story&#10;&#10;Write freely. Use markdown for **bold**, *italics*, links, images and more." /></div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            {cover && <img src={cover} alt="" className="w-full max-h-96 object-cover rounded-2xl mb-8" />}
            <h1 className="font-serif text-5xl mb-4">{title || "Untitled"}</h1>
            {subtitle && <p className="text-xl italic text-ink/60 mb-8">{subtitle}</p>}
            <Markdown>{content || "*Nothing to preview yet.*"}</Markdown>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6 max-w-2xl">
            <div><Label className="mb-1.5 block">Meta title <span className="text-xs text-ink/40">({metaTitle.length}/70)</span></Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder="Falls back to article title" /></div>
            <div><Label className="mb-1.5 block">Meta description <span className="text-xs text-ink/40">({metaDesc.length}/180)</span></Label>
              <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={180} rows={3} placeholder="Falls back to article excerpt" /></div>
            <div><Label className="mb-1.5 block">Canonical URL (optional)</Label>
              <Input value={canonical} onChange={(e) => setCanonical(e.target.value)} placeholder="https://yoursite.com/original" /></div>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
