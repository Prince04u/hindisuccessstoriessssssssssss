import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyArticles, deleteMyArticle } from "@/lib/articles.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, Heart, MessageSquare, Pencil, Trash2, PenLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HSS" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(listMyArticles);
  const del = useServerFn(deleteMyArticle);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-articles"], queryFn: () => fn() });
  const m = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-articles"] }); toast.success("Deleted"); } });

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl">Your stories</h1>
            <p className="text-ink/50 text-sm mt-1">Drafts, submissions and published work.</p>
          </div>
          <Button asChild className="rounded-full bg-ink hover:bg-accent"><Link to="/write"><PenLine className="size-3.5" />New story</Link></Button>
        </div>

        {isLoading ? <p className="text-ink/50">Loading...</p> :
          !data?.length ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <p className="text-ink/50 mb-4">You haven't written anything yet.</p>
              <Button asChild className="rounded-full bg-ink hover:bg-accent"><Link to="/write">Start writing</Link></Button>
            </div>
          ) : (
            <div className="border rounded-2xl divide-y">
              {data.map((a: any) => (
                <div key={a.id} className="p-5 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={a.status === "published" ? "default" : a.status === "pending" ? "secondary" : "outline"}>{a.status}</Badge>
                      <span className="text-xs text-ink/40">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    </div>
                    <h3 className="font-serif text-xl">{a.title}</h3>
                    {a.status === "published" && (
                      <div className="flex gap-4 text-xs text-ink/50 mt-2">
                        <span className="flex items-center gap-1"><Eye className="size-3" /> {a.view_count}</span>
                        <span className="flex items-center gap-1"><Heart className="size-3" /> {a.like_count}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {a.comment_count}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {a.status === "published" && <Button asChild variant="ghost" size="sm"><Link to="/article/$slug" params={{ slug: a.slug }}>View</Link></Button>}
                    <Button asChild variant="outline" size="sm"><Link to="/write" search={{ id: a.id }}><Pencil className="size-3" /> Edit</Link></Button>
                    {(a.status === "draft" || a.status === "rejected") && (
                      <Button variant="ghost" size="sm" onClick={() => confirm("Delete this draft?") && m.mutate(a.id)}><Trash2 className="size-3 text-destructive" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
      <SiteFooter />
    </div>
  );
}
