import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSubmissions, adminUpdateSubmission } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: AdminSubmissions,
});

function AdminSubmissions() {
  const fn = useServerFn(adminListSubmissions);
  const upd = useServerFn(adminUpdateSubmission);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-subs"], queryFn: () => fn() });
  const m = useMutation({ mutationFn: (p: any) => upd({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Updated"); } });

  return (
    <div>
      <h3 className="font-serif text-xl mb-4">Guest post submissions</h3>
      {isLoading ? <p className="text-ink/50">Loading...</p> : (
        <div className="space-y-3">
          {(data ?? []).map((s: any) => (
            <details key={s.id} className="border rounded-2xl p-4">
              <summary className="cursor-pointer flex items-center gap-3 flex-wrap">
                <Badge>{s.tier}</Badge>
                <Badge variant="outline">{s.status}</Badge>
                <span className="font-medium">{s.proposed_title}</span>
                <span className="text-xs text-ink/50">— {s.name} ({s.email}) — ${s.price_cents / 100}</span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                {s.website_url && <p><strong>Website:</strong> <a href={s.website_url} target="_blank" rel="noopener" className="text-accent hover:underline">{s.website_url}</a></p>}
                <p><strong>Pitch:</strong> {s.pitch}</p>
                {s.draft_content && <p className="whitespace-pre-wrap"><strong>Draft:</strong>{"\n"}{s.draft_content}</p>}
                <div className="flex gap-2 flex-wrap pt-3">
                  <Button size="sm" onClick={() => m.mutate({ id: s.id, status: "approved" })}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ id: s.id, status: "paid_pending_review" })}>Mark paid</Button>
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ id: s.id, status: "published" })}>Mark published</Button>
                  <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: s.id, status: "rejected" })}>Reject</Button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
