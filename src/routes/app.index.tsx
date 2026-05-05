import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inr } from "@/lib/format";
import { Receipt, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Overview });

type Stats = { clients: number; cases: number; outstanding: number; paid: number; overdue: number };

function Overview() {
  const [s, setS] = useState<Stats>({ clients: 0, cases: 0, outstanding: 0, paid: 0, overdue: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: clients }, { data: cases }] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("billing_cases").select("total_amount,payment_status,due_date"),
      ]);
      const today = new Date().toISOString().slice(0,10);
      let outstanding = 0, paid = 0, overdue = 0;
      (cases ?? []).forEach((c: any) => {
        const t = Number(c.total_amount ?? 0);
        if (c.payment_status === "paid") paid += t;
        else { outstanding += t; if (c.due_date && c.due_date < today) overdue += t; }
      });
      setS({ clients: clients ?? 0, cases: cases?.length ?? 0, outstanding, paid, overdue });
    })();
  }, []);

  const cards = [
    { label: "Clients", value: s.clients, icon: Users, tone: "text-primary" },
    { label: "Billing cases", value: s.cases, icon: Receipt, tone: "text-primary" },
    { label: "Outstanding", value: inr(s.outstanding), icon: AlertTriangle, tone: "text-warning" },
    { label: "Overdue", value: inr(s.overdue), icon: AlertTriangle, tone: "text-destructive" },
    { label: "Collected", value: inr(s.paid), icon: CheckCircle2, tone: "text-success" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">MVP foundation: companies, clients, billing cases, workflow engine, payment-stop, dispatch logging.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-semibold">{c.value}</div>
              <c.icon className={`h-5 w-5 ${c.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Get started</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Add your <Link to="/app/clients" className="text-primary underline">clients</Link>.</p>
          <p>2. Create a <Link to="/app/billing" className="text-primary underline">billing case</Link> after a candidate joins (Performa Invoice → Tax Invoice).</p>
          <p>3. Start the collection workflow — the server-side scheduler advances stages and stops automatically when payment is received.</p>
          <p>4. Watch every send in <Link to="/app/logs" className="text-primary underline">dispatch logs</Link>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
