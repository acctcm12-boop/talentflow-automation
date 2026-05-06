import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inr } from "@/lib/format";
import {
  Receipt, Users, AlertTriangle, CheckCircle2, CalendarCheck2, Award,
  UserCircle2, Briefcase, ArrowRight, Activity, Scale,
} from "lucide-react";
import { PageHeader, StageBadge } from "@/components/PageBits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({ component: Overview });

function Overview() {
  const [s, setS] = useState<any>({ clients: 0, candidates: 0, jobs: 0, interviews: 0, placements: 0, cases: 0, outstanding: 0, paid: 0, overdue: 0, legal: 0 });
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const heads = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("interviews").select("*", { count: "exact", head: true }),
        supabase.from("placements").select("*", { count: "exact", head: true }),
      ]);
      const { data: cases } = await supabase.from("billing_cases").select("total_amount,payment_status,due_date,current_stage");
      const today = new Date().toISOString().slice(0,10);
      let outstanding = 0, paid = 0, overdue = 0, legal = 0;
      (cases ?? []).forEach((c: any) => {
        const t = Number(c.total_amount ?? 0);
        if (c.payment_status === "paid") paid += t;
        else { outstanding += t; if (c.due_date && c.due_date < today) overdue += t; if (c.current_stage >= 6) legal += t; }
      });
      setS({
        clients: heads[0].count ?? 0, candidates: heads[1].count ?? 0, jobs: heads[2].count ?? 0,
        interviews: heads[3].count ?? 0, placements: heads[4].count ?? 0,
        cases: cases?.length ?? 0, outstanding, paid, overdue, legal,
      });
      const { data: logs } = await supabase.from("dispatch_logs").select("*, billing_cases(candidate_name, clients(company_name))").order("created_at", { ascending: false }).limit(8);
      setActivity(logs ?? []);
    })();
  }, []);

  const kpis = [
    { label: "Candidates", value: s.candidates, icon: UserCircle2 },
    { label: "Open jobs", value: s.jobs, icon: Briefcase },
    { label: "Interviews", value: s.interviews, icon: CalendarCheck2 },
    { label: "Placements", value: s.placements, icon: Award },
    { label: "Billing cases", value: s.cases, icon: Receipt },
    { label: "Outstanding", value: inr(s.outstanding), icon: AlertTriangle, tone: "text-warning" },
    { label: "Overdue", value: inr(s.overdue), icon: AlertTriangle, tone: "text-destructive" },
    { label: "In legal stage", value: inr(s.legal), icon: Scale, tone: "text-destructive" },
    { label: "Collected", value: inr(s.paid), icon: CheckCircle2, tone: "text-success" },
    { label: "Clients", value: s.clients, icon: Users },
  ];

  const recPipeline = [
    { label: "Candidate shared", icon: UserCircle2 },
    { label: "Interview scheduled", icon: CalendarCheck2 },
    { label: "Feedback pending", icon: AlertTriangle },
    { label: "Selected", icon: Award },
    { label: "LOI", icon: Receipt },
    { label: "Joined", icon: CheckCircle2 },
  ];
  const revPipeline = [
    { label: "Joined", icon: CheckCircle2 },
    { label: "Performa Invoice", icon: Receipt },
    { label: "Tax Invoice", icon: Receipt },
    { label: "Payment pending", icon: AlertTriangle },
    { label: "Paid / Legal", icon: Scale },
  ];

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Overview" description="Real-time view of recruitment, joining, billing and collection across your workspace." />

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map(c => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className={`text-xl font-semibold mt-1 ${c.tone ?? ""}`}>{c.value}</div>
              </div>
              <c.icon className={`h-5 w-5 ${c.tone ?? "text-primary"}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Recruitment pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {recPipeline.map((p, i) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                  <p.icon className="h-4 w-4 text-primary" />{p.label}
                </div>
                {i < recPipeline.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Revenue pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {revPipeline.map((p, i) => (
              <div key={p.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                  <p.icon className="h-4 w-4 text-primary" />{p.label}
                </div>
                {i < revPipeline.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Button asChild size="sm" variant="ghost"><Link to="/app/logs">View all <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No activity yet — start a billing case to see dispatch events here.</div>}
            {activity.map(a => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b last:border-b-0 py-2">
                <div className="text-sm">
                  <div className="font-medium">{a.billing_cases?.clients?.company_name ?? "—"} <span className="text-muted-foreground">·</span> <span className="text-muted-foreground">{a.template_key}</span></div>
                  <div className="text-xs text-muted-foreground">{a.billing_cases?.candidate_name} · {a.channel}</div>
                </div>
                <StageBadge tone={a.status === "sent" ? "success" : a.status === "failed" ? "destructive" : "muted"}>{a.status}</StageBadge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Workflow health</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Scheduler</span><span>pg_cron · every 5 min</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Send window</span><span>13:00 IST (Asia/Kolkata)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment-stop rule</span><StageBadge tone="success">enforced</StageBadge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Idempotency</span><StageBadge tone="success">per case · stage · day · channel · recipient</StageBadge></div>
            <Button asChild size="sm" variant="outline" className="w-full mt-2"><Link to="/app/health">Open health check</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
