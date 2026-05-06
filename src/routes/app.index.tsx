import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inr, fmtDateTime } from "@/lib/format";
import {
  Receipt, Users, AlertTriangle, CheckCircle2, CalendarCheck2, Award,
  UserCircle2, Briefcase, ArrowRight, Activity, Scale, Bot, Workflow, Sparkles, BellRing, Mail, ScrollText,
} from "lucide-react";
import { PageHeader, StageBadge } from "@/components/PageBits";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({ component: Overview });

function Overview() {
  const [s, setS] = useState<any>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [nextActions, setNext] = useState<string[]>([]);
  const [empty, setEmpty] = useState(false);

  const load = async () => {
    const today = new Date().toISOString().slice(0,10);
    const heads = await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("interviews").select("*", { count: "exact", head: true }),
      supabase.from("placements").select("*", { count: "exact", head: true }),
    ]);
    const { data: cases } = await supabase.from("billing_cases").select("total_amount,payment_status,due_date,current_stage,automation_status");
    const { data: jobs } = await supabase.from("automation_jobs").select("*", { count: "exact" }).eq("status","pending").lte("scheduled_at", new Date().toISOString());
    const { data: queueRows } = await supabase.from("automation_jobs").select("*").eq("status","pending").order("scheduled_at").limit(8);
    const { data: placements } = await supabase.from("placements").select("loi_status,joining_date,status,candidate_confirmed,client_confirmed");
    const { data: interviews } = await supabase.from("interviews").select("status");
    let outstanding=0,paid=0,overdue=0,legal=0,activeCol=0;
    (cases ?? []).forEach((c:any)=>{ const t=Number(c.total_amount??0);
      if (c.payment_status==="paid") paid+=t;
      else { outstanding+=t; if (c.automation_status==="running") activeCol++; if (c.due_date&&c.due_date<today) overdue+=t; if (c.current_stage>=6) legal+=t; }
    });
    const loiPending = (placements ?? []).filter((p:any)=>p.loi_status==="pending"||p.loi_status==="issued").length;
    const joiningWeek = (placements ?? []).filter((p:any)=>p.joining_date && p.joining_date >= today && p.joining_date <= new Date(Date.now()+7*86400000).toISOString().slice(0,10)).length;
    const feedbackPending = (interviews ?? []).filter((i:any)=>i.status?.includes("feedback") || i.status?.includes("pending")).length;
    setS({
      clients:heads[0].count??0, candidates:heads[1].count??0, jobs:heads[2].count??0,
      interviews:heads[3].count??0, placements:heads[4].count??0, cases:cases?.length??0,
      outstanding, paid, overdue, legal, dueJobs: jobs?.length ?? 0, activeCol, loiPending, joiningWeek, feedbackPending,
    });
    setQueue(queueRows ?? []);
    setEmpty((heads[0].count ?? 0) === 0);
    const next: string[] = [];
    if (feedbackPending) next.push(`${feedbackPending} interview(s) need client feedback`);
    if (loiPending) next.push(`${loiPending} selected candidate(s) need LOI follow-up`);
    if (joiningWeek) next.push(`${joiningWeek} candidate(s) joining this week — confirm joining`);
    if (overdue) next.push(`${overdue ? `${(cases??[]).filter((c:any)=>c.payment_status!=="paid"&&c.due_date&&c.due_date<today).length} overdue Tax Invoice(s)` : ""} need collection follow-up`);
    setNext(next);
    const { data: logs } = await supabase.from("dispatch_logs").select("*, billing_cases(candidate_name, clients(company_name))").order("created_at", { ascending: false }).limit(6);
    setActivity(logs ?? []);
  };
  useEffect(() => { load(); }, []);

  const loadDemo = async () => {
    const { data, error } = await supabase.rpc("load_demo_data");
    if (error) return toast.error(error.message);
    if ((data as any)?.skipped) toast.info("Demo data skipped — workspace already has data");
    else toast.success("Demo data loaded");
    load();
  };
  const seedTpl = async () => {
    const { data, error } = await supabase.rpc("seed_default_templates");
    if (error) return toast.error(error.message);
    toast.success(`${data} templates seeded`);
  };

  const cockpit = [
    { label:"Interview bots running", value: s.interviews ?? 0, icon: CalendarCheck2 },
    { label:"Candidate follow-ups", value: s.candidates ?? 0, icon: UserCircle2 },
    { label:"Client feedback pending", value: s.feedbackPending ?? 0, icon: Mail, tone:"text-warning" },
    { label:"LOI follow-ups", value: s.loiPending ?? 0, icon: Award, tone:"text-warning" },
    { label:"Joining this week", value: s.joiningWeek ?? 0, icon: CheckCircle2 },
    { label:"Collection follow-ups", value: s.activeCol ?? 0, icon: ScrollText },
    { label:"Internal alerts", value: 0, icon: BellRing },
    { label:"Legal escalations", value: inr(s.legal ?? 0), icon: Scale, tone:"text-destructive" },
  ];

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Automation Cockpit"
        description="Live view of every running follow-up bot, queued message, pending action and recovery stage across your workspace."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedTpl}><Mail className="h-4 w-4 mr-2" />Seed default templates</Button>
            <Button onClick={loadDemo}><Sparkles className="h-4 w-4 mr-2" />Load demo data</Button>
          </div>
        } />

      {empty && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <h3 className="text-lg font-semibold">Start your first automation</h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Add a Client →  2. Add a Candidate →  3. Create a Job →  4. Schedule an Interview</li>
              <li>5. TalentFlow takes over follow-ups, billing reminders and legal escalation automatically.</li>
            </ol>
            <div className="flex justify-center gap-2">
              <Button onClick={loadDemo}><Sparkles className="h-4 w-4 mr-2" />Load demo data</Button>
              <Button variant="outline" asChild><Link to="/app/clients">Add client</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Automation Command Centre</div>
        <div className="grid gap-3 md:grid-cols-4">
          {cockpit.map(c => (
            <Card key={c.label}><CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className={`text-xl font-semibold mt-1 ${c.tone ?? ""}`}>{c.value}</div>
              </div>
              <c.icon className={`h-5 w-5 ${c.tone ?? "text-primary"}`} />
            </CardContent></Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Workflow className="h-4 w-4 text-primary" />Today's Automation Queue</CardTitle>
            <Button asChild size="sm" variant="ghost"><Link to="/app/automation">View all <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">No automated messages queued. Schedule an interview or start a billing case to fill the queue.</div>}
            {queue.map(j => (
              <div key={j.id} className="flex items-center justify-between border-b last:border-b-0 py-2 text-sm">
                <div>
                  <div className="font-medium">{j.template_key}</div>
                  <div className="text-xs text-muted-foreground">{j.recipient_name ?? j.recipient_contact} · {j.recipient_channel}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{fmtDateTime(j.scheduled_at)}</div>
                  <StageBadge tone="warning">{j.status}</StageBadge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Next Action Intelligence</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {nextActions.length === 0 && <div className="text-muted-foreground">All caught up. No manual intervention needed right now.</div>}
            {nextActions.map((n,i) => (
              <div key={i} className="flex items-start gap-2"><span className="text-primary mt-0.5">›</span>{n}</div>
            ))}
            <div className="pt-2"><Button asChild size="sm" variant="outline"><Link to="/app/copilot"><Bot className="h-4 w-4 mr-2" />Ask AI Copilot</Link></Button></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Active Workflow Monitor</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Candidate", icon: UserCircle2 },
              { label: "Interview", icon: CalendarCheck2 },
              { label: "Feedback", icon: Mail },
              { label: "Selection", icon: Award },
              { label: "LOI", icon: Receipt },
              { label: "Joining", icon: CheckCircle2 },
              { label: "Billing", icon: Receipt },
              { label: "Collection", icon: ScrollText },
              { label: "Payment", icon: CheckCircle2 },
            ].map((p,i,arr)=>(
              <div key={p.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                  <p.icon className="h-4 w-4 text-primary" />{p.label}
                </div>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label:"Clients", value:s.clients }, { label:"Candidates", value:s.candidates },
          { label:"Outstanding", value:inr(s.outstanding ?? 0), tone:"text-warning" },
          { label:"Overdue", value:inr(s.overdue ?? 0), tone:"text-destructive" },
          { label:"Collected", value:inr(s.paid ?? 0), tone:"text-success" },
        ].map(c => (
          <Card key={c.label}><CardContent className="pt-5 pb-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className={`text-xl font-semibold mt-1 ${c.tone ?? ""}`}>{c.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent dispatches</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No dispatch activity yet.</div>}
            {activity.map(a => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b last:border-b-0 py-2">
                <div className="text-sm">
                  <div className="font-medium">{a.billing_cases?.clients?.company_name ?? "—"} · <span className="text-muted-foreground">{a.template_key}</span></div>
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
            <div className="flex justify-between"><span className="text-muted-foreground">Send window</span><span>13:00 IST</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due automation jobs</span><StageBadge tone={s.dueJobs ? "warning" : "success"}>{s.dueJobs ?? 0}</StageBadge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment-stop rule</span><StageBadge tone="success">enforced</StageBadge></div>
            <Button asChild size="sm" variant="outline" className="w-full mt-2"><Link to="/app/health">Open health check</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
