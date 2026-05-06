import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageBits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, BarChart3 } from "lucide-react";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { downloadExcel } from "@/lib/excel";

export const Route = createFileRoute("/app/reports")({ component: Reports });

function Reports() {
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, paid: 0, cases: 0, interviews: 0, placements: 0 });
  const [rows, setRows] = useState<any>({ billing: [], interviews: [], placements: [], jobs: [], candidates: [], clients: [], automation: [], ai: [] });
  const [companyName, setCompanyName] = useState("Workspace");

  useEffect(() => {
    (async () => {
      const [{ data: bc }, { data: iv }, { data: pl }, { data: jo }, { data: ca }, { data: cl }, { data: aj }, { data: ai }, { data: comp }] = await Promise.all([
        supabase.from("billing_cases").select("*, clients(company_name)"),
        supabase.from("interviews").select("*, candidates(full_name), clients(company_name)"),
        supabase.from("placements").select("*, candidates(full_name), clients(company_name)"),
        supabase.from("jobs").select("*, clients(company_name)"),
        supabase.from("candidates").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("automation_jobs").select("*"),
        supabase.from("ai_query_logs").select("*"),
        supabase.from("companies").select("name").maybeSingle(),
      ]);
      setRows({ billing: bc ?? [], interviews: iv ?? [], placements: pl ?? [], jobs: jo ?? [], candidates: ca ?? [], clients: cl ?? [], automation: aj ?? [], ai: ai ?? [] });
      setCompanyName(comp?.name ?? "Workspace");
      let outstanding = 0, paid = 0, revenue = 0;
      (bc ?? []).forEach((c: any) => { const t = Number(c.total_amount ?? 0); revenue += t; if (c.payment_status === "paid") paid += t; else outstanding += t; });
      setStats({ revenue, outstanding, paid, cases: bc?.length ?? 0, interviews: iv?.length ?? 0, placements: pl?.length ?? 0 });
    })();
  }, []);

  const reports = [
    { title: "Revenue Report", desc: "All billing cases, totals and payment status.", sheets: [{ name: "Billing", rows: rows.billing }] },
    { title: "Collection Report", desc: "Outstanding cases by collection stage.", sheets: [{ name: "Outstanding", rows: rows.billing.filter((c: any) => c.payment_status !== "paid") }] },
    { title: "Placement Report", desc: "Selections, LOI, joining and billing handoff.", sheets: [{ name: "Placements", rows: rows.placements }] },
    { title: "Interview Report", desc: "Scheduled interviews by status.", sheets: [{ name: "Interviews", rows: rows.interviews }] },
    { title: "Recruitment Funnel Report", desc: "Candidates, jobs, interviews, placements.", sheets: [{name:"Candidates",rows:rows.candidates},{name:"Jobs",rows:rows.jobs},{name:"Interviews",rows:rows.interviews},{name:"Placements",rows:rows.placements}] },
    { title: "Client Performance Report", desc: "Per-client billing & outstanding.", sheets: [{ name: "Clients", rows: rows.clients }, { name: "Billing", rows: rows.billing }] },
    { title: "Automation Job Report", desc: "Every queued automation job.", sheets: [{ name: "Automation", rows: rows.automation }] },
    { title: "AI Query Report", desc: "AI Copilot questions and answers.", sheets: [{ name: "AI Logs", rows: rows.ai }] },
    { title: "Pending Action Report", desc: "Pending invoices, LOI, joining confirmations.", sheets: [
      { name: "PendingPI", rows: rows.billing.filter((c:any)=>!c.performa_invoice_no) },
      { name: "PendingTI", rows: rows.billing.filter((c:any)=>!c.tax_invoice_no) },
      { name: "PendingLOI", rows: rows.placements.filter((p:any)=>p.loi_status!=="accepted") },
    ] },
  ];

  const exp = (r: typeof reports[number]) => {
    if (r.sheets.every(s => !s.rows.length)) return toast.info("No data to export");
    const filename = `${r.title.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.xlsx`;
    downloadExcel(filename, r.sheets, { Company: companyName, Report: r.title, ExportedAt: new Date().toISOString() });
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Reports"
        description="Excel (.xlsx) exports for revenue, collections, placements, interviews, automation and AI queries. Each sheet includes a Report Info tab with company name and timestamp." />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total billed", value: inr(stats.revenue) },
          { label: "Collected", value: inr(stats.paid) },
          { label: "Outstanding", value: inr(stats.outstanding) },
          { label: "Cases", value: stats.cases },
          { label: "Interviews", value: stats.interviews },
          { label: "Placements", value: stats.placements },
        ].map(c => (
          <Card key={c.label}><CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map(r => (
          <Card key={r.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />{r.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => exp(r)}>
                <Download className="h-4 w-4 mr-2" />Excel
              </Button>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{r.sheets.reduce((a,s)=>a+s.rows.length,0)} rows across {r.sheets.length} sheet(s)</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
