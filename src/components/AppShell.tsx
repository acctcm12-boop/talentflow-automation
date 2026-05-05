import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Receipt, FileText, Settings, LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/billing", label: "Billing Cases", icon: Receipt },
  { to: "/app/logs", label: "Dispatch Logs", icon: FileText },
  { to: "/app/health", label: "Health Check", icon: Activity },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="text-sm uppercase tracking-wider opacity-60">Recruitment</div>
          <div className="font-semibold text-lg">Revenue Engine</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => {
            const active = path === n.to || (n.to !== "/app" && path.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-2 text-xs opacity-70">{profile?.full_name ?? "User"}</div>
          <Button size="sm" variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
