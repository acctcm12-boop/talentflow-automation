import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/app/logs")({ component: Logs });

function Logs() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("dispatch_logs").select("*, billing_cases(candidate_name, clients(company_name))").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="p-8 space-y-6">
      <div><h1 className="text-2xl font-semibold">Dispatch logs</h1><p className="text-sm text-muted-foreground">Every send is recorded with an idempotency key — no duplicate reminders.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Time</TableHead><TableHead>Case</TableHead><TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead><TableHead>Template</TableHead><TableHead>Stage</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No dispatch attempts yet</TableCell></TableRow>}
              {rows.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(l.created_at)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{l.billing_cases?.clients?.company_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{l.billing_cases?.candidate_name}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{l.channel}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.recipient ?? "—"}</TableCell>
                  <TableCell className="text-xs">{l.template_key}</TableCell>
                  <TableCell className="text-xs">S{l.stage}/D{l.stage_day}</TableCell>
                  <TableCell><Badge variant={l.status === "sent" ? "default" : l.status === "failed" ? "destructive" : "secondary"}>{l.status}</Badge>
                    {l.error && <div className="text-xs text-destructive mt-1">{l.error}</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
