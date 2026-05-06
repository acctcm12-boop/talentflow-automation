import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Briefcase, CalendarCheck2, Award, Receipt, BellRing,
  BarChart3, FileText, Settings, LogOut, Activity, UserCircle2, ScrollText, Mail, Bot, Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups: { label: string; items: { to: string; label: string; icon: any }[] }[] = [
  { label: "Cockpit", items: [
    { to: "/app", label: "Automation Cockpit", icon: LayoutDashboard },
    { to: "/app/copilot", label: "AI Copilot", icon: Bot },
    { to: "/app/automation", label: "Automation Queue", icon: Workflow },
  ]},
  { label: "Pipeline", items: [
    { to: "/app/candidates", label: "Candidates", icon: UserCircle2 },
    { to: "/app/clients", label: "Clients", icon: Users },
    { to: "/app/jobs", label: "Jobs", icon: Briefcase },
    { to: "/app/interviews", label: "Interviews", icon: CalendarCheck2 },
    { to: "/app/placements", label: "Placements", icon: Award },
  ]},
  { label: "Revenue", items: [
    { to: "/app/billing", label: "Billing", icon: Receipt },
    { to: "/app/collections", label: "Collections", icon: ScrollText },
    { to: "/app/internal-alerts", label: "Internal Alerts", icon: BellRing },
    { to: "/app/reports", label: "Reports", icon: BarChart3 },
  ]},
  { label: "System", items: [
    { to: "/app/templates", label: "Templates", icon: Mail },
    { to: "/app/logs", label: "Dispatch Logs", icon: FileText },
    { to: "/app/health", label: "Health Check", icon: Activity },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ]},
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">T</div>
            <div>
              <div className="font-semibold leading-tight">TalentFlow</div>
              <div className="text-[10px] uppercase tracking-wider opacity-60">Revenue Engine</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {groups.map(g => (
            <div key={g.label}>
              <div className="px-2 mb-1 text-[10px] uppercase tracking-wider opacity-50">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map(n => {
                  const active = path === n.to || (n.to !== "/app" && path.startsWith(n.to));
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <n.icon className="h-4 w-4" />{n.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-2 text-xs opacity-70 truncate">{profile?.full_name ?? "User"}</div>
          <Button size="sm" variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
