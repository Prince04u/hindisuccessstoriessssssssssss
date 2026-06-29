import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminToggleRole } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const ROLES = ["admin", "editor", "author", "reader"] as const;

function AdminUsers() {
  const fn = useServerFn(adminListUsers);
  const tog = useServerFn(adminToggleRole);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fn() });
  const m = useMutation({ mutationFn: (p: { user_id: string; role: typeof ROLES[number] }) => tog({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Updated"); } });

  return (
    <div>
      <h3 className="font-serif text-xl mb-4">Users</h3>
      {isLoading ? <p className="text-ink/50">Loading...</p> : (
        <div className="border rounded-2xl divide-y">
          {(data ?? []).map((u: any) => (
            <div key={u.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="size-10 rounded-full bg-stone-200 overflow-hidden shrink-0">{u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.display_name}</p>
                <p className="text-xs text-ink/50">@{u.username}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {ROLES.map((r) => {
                  const has = u.roles.includes(r);
                  return (
                    <Button key={r} size="sm" variant={has ? "default" : "outline"} className="text-xs h-7" onClick={() => m.mutate({ user_id: u.id, role: r })}>
                      {r}{has ? " ✓" : ""}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
