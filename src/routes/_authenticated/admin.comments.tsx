import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListComments, adminToggleCommentHidden } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: AdminComments,
});

function AdminComments() {
  const fn = useServerFn(adminListComments);
  const tog = useServerFn(adminToggleCommentHidden);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-comments"], queryFn: () => fn() });
  const m = useMutation({ mutationFn: (p: { id: string; hidden: boolean }) => tog({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-comments"] }); toast.success("Updated"); } });
  return (
    <div>
      <h3 className="font-serif text-xl mb-4">Comments</h3>
      {isLoading ? <p className="text-ink/50">Loading...</p> : (
        <div className="border rounded-2xl divide-y">
          {(data ?? []).map((c: any) => (
            <div key={c.id} className="p-4 flex gap-3 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="font-medium">{c.author?.display_name}</span>
                  <span className="text-ink/40">on</span>
                  <Link to="/article/$slug" params={{ slug: c.article?.slug ?? "" }} className="text-accent hover:underline">{c.article?.title}</Link>
                  <span className="text-ink/40">· {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  {c.is_hidden && <Badge variant="destructive">Hidden</Badge>}
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => m.mutate({ id: c.id, hidden: !c.is_hidden })}>{c.is_hidden ? "Show" : "Hide"}</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
