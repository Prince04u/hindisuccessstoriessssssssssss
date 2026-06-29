import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — HSS" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const tabs: { to: string; label: string; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/articles", label: "Articles" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/submissions", label: "Submissions" },
  { to: "/admin/comments", label: "Comments" },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        <h1 className="font-serif text-4xl mb-1">Admin</h1>
        <p className="text-ink/50 text-sm mb-6">Manage content, users and submissions.</p>
        <nav className="flex gap-1 mb-8 border-b">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to as any} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-accent text-accent" : "border-transparent text-ink/60 hover:text-ink"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
