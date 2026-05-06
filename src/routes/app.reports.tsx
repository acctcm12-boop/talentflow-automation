import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageBits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, BarChart3 } from "lucide-react";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({ component: Reports });

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
}
function downloadCsv(filename: string, rows: any[]) {
  if (!rows.length) { toast.info("No data to export"); return; }
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

function Reports() {
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, paid: 0, cases: 0, interviews: 0, placements: 0 });
  const [rows, setRows] = useState<{ billing: any[]; interviews: any[]; placements: any[] }>({ billing: [], interviews: [], placements: [] });

  useEffect(() => {
    (async () => {
      const [{ data: bc }, { data: iv }, { data: pl }] = await Promise.all([
        supabase.from("billing_cases").select("*, clients(company_name)"),
        supabase.from("interviews").select("*"),
        supabase.from("placements").select("*"),
      ]);
      const billing = bc ?? []; const interviews = iv ?? []; const placements = pl ?? [];
      setRows({ billing, interviews, placements });
      let outstanding = 0, paid = 0, revenue = 0;
      billing.forEach((c: any) => {
        const t = Number(c.total_amount ?? 0); revenue += t;
        if (c.payment_status === "paid") paid += t; else outstanding += t;
      });
      setStats({ revenue, outstanding, paid, cases: billing.length, interviews: interviews.length, placements: placements.length });
    })();
  }, []);

  const reports = [
    { title: "Revenue Report", desc: "All billing cases, totals and payment status.", rows: rows.billing, file: "Revenue_Report.csv" },
    { title: "Collection Report", desc: "Outstanding cases by current stage.", rows: rows.billing.filter((c: any) => c.payment_status !== "paid"), file: "Collection_Report.csv" },
    { title: "Placement Report", desc: "Selections, LOI, joining and billing handoff.", rows: rows.placements, file: "Placement_Report.csv" },
    { title: "Interview Report", desc: "Scheduled interviews by status.", rows: rows.interviews, file: "Interview_Report.csv" },
  ];

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Reports" description="KPI summaries and CSV exports for revenue, collections, placements and interviews." />
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
              <Button size="sm" variant="outline" onClick={() => downloadCsv(r.file, r.rows)}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{r.rows.length} rows</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
