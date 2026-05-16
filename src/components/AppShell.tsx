import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard, Users, Briefcase, CalendarCheck2, Award, Receipt, BellRing,
  BarChart3, FileText, Settings, LogOut, Activity, UserCircle2, ScrollText, Mail, Bot, Workflow, Sparkles,
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
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border relative">
        <div className="pointer-events-none absolute inset-0 opacity-40"
             style={{ background: "radial-gradient(600px 200px at 50% -10%, color-mix(in oklab, var(--sidebar-primary) 40%, transparent), transparent 60%)" }} />
        <div className="relative px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center font-bold shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold leading-tight tracking-tight">TalentFlow</div>
              <div className="text-[10px] uppercase tracking-[0.16em] opacity-60">Revenue Engine</div>
            </div>
          </div>
        </div>
        <nav className="relative flex-1 p-3 space-y-5 overflow-y-auto">
          {groups.map(g => (
            <div key={g.label}>
              <div className="px-2 mb-1 text-[10px] uppercase tracking-[0.18em] opacity-50">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map(n => {
                  const active = path === n.to || (n.to !== "/app" && path.startsWith(n.to));
                  return (
                    <Link key={n.to} to={n.to} className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative",
                      active
                        ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-soft"
                        : "hover:bg-sidebar-accent/60 hover:translate-x-0.5"
                    )}>
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-primary" />}
                      <n.icon className={cn("h-4 w-4 transition-colors", active ? "text-sidebar-primary" : "opacity-70 group-hover:opacity-100")} />
                      <span className="truncate">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="relative p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="text-xs opacity-80 truncate">{profile?.full_name ?? "User"}</div>
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent" />
          </div>
          <Button size="sm" variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-hero">{children}</main>
    </div>
  );
}
