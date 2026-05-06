import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StageBadge } from "@/components/PageBits";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { inr, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/app/collections")({ component: Collections });

const COLS = [
  { key: "not_started", label: "Not started" },
  { key: "due_soon",    label: "Due soon" },
  { key: "due_today",   label: "Due today" },
  { key: "gentle",      label: "Gentle reminder" },
  { key: "legal",       label: "Legal notices" },
  { key: "advocate",    label: "Advocate" },
  { key: "msme",        label: "MSME" },
  { key: "gst",         label: "GST" },
  { key: "third_party", label: "Third party" },
  { key: "court",       label: "Court" },
  { key: "paid",        label: "Paid" },
  { key: "paused",      label: "Paused" },
];

function bucketize(c: any): string {
  if (c.payment_status === "paid") return "paid";
  if (c.automation_status === "paused") return "paused";
  if (!c.due_date) return "not_started";
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(c.due_date); due.setHours(0,0,0,0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  if (diff < -2) return "not_started";
  if (diff < 0) return "due_soon";
  if (diff === 0) return "due_today";
  if (diff <= 7) return "gentle";
  if (diff <= 11) return "legal";
  if (diff === 12) return "advocate";
  if (diff <= 21) return "msme";
  if (diff <= 23) return "gst";
  if (diff <= 25) return "third_party";
  return "court";
}

function Collections() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("billing_cases").select("*, clients(company_name)").then(r => setRows(r.data ?? []));
  }, []);

  if (rows.length === 0) {
    return (
      <div className="p-8">
        <PageHeader title="Collections" description="Stage-wise pipeline of every Tax Invoice from due-soon through court transfer." />
        <EmptyState icon={ScrollText} title="No active collections" description="Once you start a billing case, it will appear here grouped by collection stage." />
      </div>
    );
  }

  const grouped: Record<string, any[]> = {};
  rows.forEach(r => { const b = bucketize(r); (grouped[b] ??= []).push(r); });

  return (
    <div className="p-8">
      <PageHeader title="Collections" description="Stage-wise pipeline. Payment received instantly removes a case from automation." />
      <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 overflow-x-auto pb-4">
        {COLS.map(col => (
          <div key={col.key} className="min-w-[240px]">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
              <span>{col.label}</span>
              <span>{(grouped[col.key] ?? []).length}</span>
            </div>
            <div className="space-y-2">
              {(grouped[col.key] ?? []).map(c => (
                <Card key={c.id}><CardContent className="p-3">
                  <div className="font-medium text-sm">{c.clients?.company_name ?? "Client"}</div>
                  <div className="text-xs text-muted-foreground">{c.candidate_name}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>{inr(c.total_amount)}</span>
                    <StageBadge tone={col.key === "paid" ? "success" : col.key === "court" ? "destructive" : "default"}>S{c.current_stage}</StageBadge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Due {fmtDate(c.due_date)}</div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
