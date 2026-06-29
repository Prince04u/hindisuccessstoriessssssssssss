import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PenLine, LogOut, LayoutDashboard, Shield } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setProfile(null); return; }
    supabase.from("profiles").select("username,display_name,avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data as any));
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5 px-4 md:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-serif text-xl md:text-2xl font-bold tracking-tighter uppercase">HSS</Link>
        <div className="hidden md:flex gap-6 text-xs font-medium text-ink/60 uppercase tracking-widest">
          <Link to="/category/$slug" params={{ slug: "success-stories" }} className="hover:text-accent transition-colors">Success stories</Link>
          <Link to="/category/$slug" params={{ slug: "interviews" }} className="hover:text-accent transition-colors">Interviews</Link>
          <Link to="/category/$slug" params={{ slug: "entrepreneurship" }} className="hover:text-accent transition-colors">Entrepreneurship</Link>
          <Link to="/submit" className="hover:text-accent transition-colors">Guest Post</Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Button asChild size="sm" className="rounded-full bg-ink text-white hover:bg-accent">
              <Link to="/write"><PenLine className="size-3.5" />Write</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="size-9 cursor-pointer ring-1 ring-ink/10">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{(profile?.display_name ?? user.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{profile?.display_name ?? "Reader"}</div>
                  <div className="text-xs text-muted-foreground">@{profile?.username ?? "—"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}><LayoutDashboard className="size-4" /> Dashboard</DropdownMenuItem>
                {profile?.username && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/author/$username", params: { username: profile.username } })}>
                    My profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}><Shield className="size-4" /> Admin</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-ink text-white hover:bg-accent">
              <Link to="/auth"><PenLine className="size-3.5" />Write</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
