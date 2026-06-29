import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListArticles, adminUpdateArticle } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  component: AdminArticles,
});

function AdminArticles() {
  const fn = useServerFn(adminListArticles);
  const upd = useServerFn(adminUpdateArticle);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-articles", filter], queryFn: () => fn({ data: { status: filter || undefined } }) });
  const m = useMutation({ mutationFn: (p: any) => upd({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-articles"] }); toast.success("Updated"); } });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif text-xl">All articles</h3>
        <Select value={filter || "all"} onValueChange={(v) => setFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-ink/50">Loading...</p> : (
        <div className="border rounded-2xl divide-y">
          {(data ?? []).map((a: any) => (
            <div key={a.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={a.status === "published" ? "default" : "outline"}>{a.status}</Badge>
                  {a.is_featured && <Badge variant="secondary">Featured</Badge>}
                  <Badge variant="outline">{a.link_policy}</Badge>
                </div>
                <p className="font-medium truncate">{a.title}</p>
                <p className="text-xs text-ink/50">by {a.author?.display_name} · {a.view_count} views</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {a.status !== "published" && <Button size="sm" onClick={() => m.mutate({ id: a.id, status: "published" })}>Publish</Button>}
                {a.status === "pending" && <Button size="sm" variant="outline" onClick={() => m.mutate({ id: a.id, status: "rejected" })}>Reject</Button>}
                {a.status === "published" && <Button size="sm" variant="outline" onClick={() => m.mutate({ id: a.id, status: "archived" })}>Archive</Button>}
                <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: a.id, is_featured: !a.is_featured })}>{a.is_featured ? "Unfeature" : "Feature"}</Button>
                <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: a.id, link_policy: a.link_policy === "dofollow" ? "nofollow" : "dofollow" })}>Links: {a.link_policy === "dofollow" ? "→ nofollow" : "→ dofollow"}</Button>
                {a.status === "published" && <Button asChild size="sm" variant="ghost"><Link to="/article/$slug" params={{ slug: a.slug }}>View</Link></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
