import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/PageBits";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/app/internal-alerts")({ component: Alerts });

function Alerts() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      // synthesise alerts from billing cases requiring action
      const { data } = await supabase.from("billing_cases").select("*, clients(company_name)").is("performa_invoice_no", null).limit(50);
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div className="p-8">
      <PageHeader title="Internal Alerts" description="Pending internal actions across the workspace — Performa Invoice generation, joining confirmation, MSME / GST / court filings, etc." />
      {rows.length === 0 ? (
        <EmptyState icon={BellRing} title="All caught up" description="No internal alerts pending. Alerts appear when responsible team members need to take action." />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Action</TableHead><TableHead>Client</TableHead><TableHead>Candidate</TableHead><TableHead>Due</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">Performa Invoice pending</TableCell>
                <TableCell>{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.candidate_name}</TableCell>
                <TableCell>{r.due_date ?? "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
