import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StageBadge } from "@/components/PageBits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/automation")({ component: Automation });

function Automation() {
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const load = async () => {
    const { data } = await supabase.from("automation_jobs").select("*").order("scheduled_at", { ascending: true }).limit(200);
    setRows(data ?? []);
    const by: any = { pending: 0, sent: 0, failed: 0, skipped: 0, cancelled: 0 };
    (data ?? []).forEach(j => { by[j.status] = (by[j.status] ?? 0) + 1; });
    setCounts(by);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Automation Queue" description="Every automated message is queued here before it is sent. The scheduler processes due jobs at 13:00 IST every day." actions={
        <Button variant="outline" onClick={load}><RefreshCcw className="h-4 w-4 mr-2" />Refresh</Button>
      }/>
      <div className="grid gap-3 md:grid-cols-5">
        {["pending","sent","failed","skipped","cancelled"].map(k => (
          <Card key={k}><CardContent className="pt-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="text-2xl font-semibold mt-1">{counts[k] ?? 0}</div>
          </CardContent></Card>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Bot} title="No automation jobs yet"
          description="Jobs are created automatically when you schedule interviews, mark placements, create billing cases, or run the scheduler." />
      ) : (
        <Card><CardHeader><CardTitle className="text-base">Queue</CardTitle></CardHeader><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Scheduled</TableHead><TableHead>Workflow</TableHead><TableHead>Recipient</TableHead>
              <TableHead>Channel</TableHead><TableHead>Template</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(j => (
              <TableRow key={j.id}>
                <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(j.scheduled_at)}</TableCell>
                <TableCell className="capitalize">{j.workflow_type}</TableCell>
                <TableCell>{j.recipient_name ?? j.recipient_contact ?? "—"}</TableCell>
                <TableCell className="capitalize">{j.recipient_channel}</TableCell>
                <TableCell className="font-mono text-xs">{j.template_key ?? "—"}</TableCell>
                <TableCell><StageBadge tone={j.status === "sent" ? "success" : j.status === "failed" ? "destructive" : j.status === "cancelled" ? "muted" : "warning"}>{j.status}</StageBadge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
