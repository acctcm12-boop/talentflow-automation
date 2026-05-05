import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/health")({ component: Health });

function Health() {
  const [stats, setStats] = useState<any>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ count: due }, { count: paid }, { count: paused }, { data: lastRun }] = await Promise.all([
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("automation_status", "running").lte("next_run_at", new Date().toISOString()),
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("automation_status", "paused"),
      supabase.from("dispatch_logs").select("created_at").order("created_at", { ascending: false }).limit(1),
    ]);
    setStats({ due, paid, paused, lastRun: lastRun?.[0]?.created_at });
  };
  useEffect(() => { load(); }, []);

  const trigger = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/public/scheduler/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json();
      toast.success(`Scheduler ran: ${j.processed} processed, ${j.skipped} skipped`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div><h1 className="text-2xl font-semibold">Health check</h1><p className="text-sm text-muted-foreground">Server-side scheduler readiness.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-xs uppercase text-muted-foreground">Due jobs</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.due ?? "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs uppercase text-muted-foreground">Paid (skipped)</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.paid ?? "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs uppercase text-muted-foreground">Paused</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.paused ?? "—"}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Scheduler</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Last dispatch: <span className="font-mono">{stats.lastRun ?? "—"}</span></div>
          <div className="text-sm">Endpoint: <code className="bg-muted px-2 py-0.5 rounded">/api/public/scheduler/run</code> <Badge variant="secondary">runs every 5 min via pg_cron</Badge></div>
          <Button onClick={trigger} disabled={busy}>Run dry test now</Button>
        </CardContent>
      </Card>
    </div>
  );
}
