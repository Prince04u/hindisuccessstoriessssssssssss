import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboard } from "@/lib/admin.functions";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const fn = useServerFn(adminDashboard);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-dash"], queryFn: () => fn(), retry: false });
  if (isLoading) return <p className="text-ink/50">Loading...</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;
  if (!data) return null;
  const s = data.stats;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", value: s.users }, { label: "Published", value: s.articles },
          { label: "Pending review", value: s.pending }, { label: "Submissions", value: s.submissions },
        ].map((c) => (
          <div key={c.label} className="border rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">{c.label}</p>
            <p className="font-serif text-4xl">{c.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-serif text-xl mb-4">Recent activity</h3>
        <div className="border rounded-2xl divide-y">
          {data.recent.map((a: any) => (
            <Link key={a.id} to="/admin/articles" className="flex items-center justify-between p-4 hover:bg-muted/50">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-ink/50">{a.author?.display_name} · {a.status}</p>
              </div>
              <span className="text-xs text-ink/40">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
