import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageBits";

export const Route = createFileRoute("/app/health")({ component: Health });

function Health() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [providers, setProviders] = useState<any>({});
  const [persons, setPersons] = useState<number>(0);
  const [tplCount, setTplCount] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const nowIso = new Date().toISOString();
    const [{ count: due }, { count: paid }, { count: paused }, { data: lastRun }, { count: pendJobs }, { count: failedJobs }, { count: skippedJobs }, { data: prov }, { count: ppl }, { count: tpl }] = await Promise.all([
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("automation_status", "running").lte("next_run_at", nowIso),
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
      supabase.from("billing_cases").select("*", { count: "exact", head: true }).eq("automation_status", "paused"),
      supabase.from("dispatch_logs").select("created_at").order("created_at", { ascending: false }).limit(1),
      supabase.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status","pending"),
      supabase.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status","failed"),
      supabase.from("automation_jobs").select("*", { count: "exact", head: true }).eq("status","skipped"),
      supabase.from("provider_settings").select("*").maybeSingle(),
      supabase.from("internal_persons").select("*", { count: "exact", head: true }),
      supabase.from("templates").select("*", { count: "exact", head: true }),
    ]);
    setStats({ due, paid, paused, lastRun: lastRun?.[0]?.created_at, pendJobs, failedJobs, skippedJobs });
    setProviders(prov ?? {});
    setPersons(ppl ?? 0); setTplCount(tpl ?? 0);
  };
  useEffect(() => { load(); }, []);

  const trigger = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/public/scheduler/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json();
      toast.success(`Scheduler ran: ${j.processed} processed, ${j.skipped} skipped`);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const status = (ok: boolean, label: string) => <Badge variant={ok ? "default" : "secondary"}>{ok ? "configured" : label}</Badge>;

  const warnings: string[] = [];
  if (!providers.email_smtp_host) warnings.push("Email (SMTP) not configured");
  if (!providers.whatsapp_token) warnings.push("WhatsApp (Com.bot v19) not configured");
  if (!providers.sms_api_key) warnings.push("SMS provider not configured");
  if (persons === 0) warnings.push("No internal responsible persons added");
  if (tplCount === 0) warnings.push("No message templates seeded — click 'Seed default templates' on the cockpit");

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Health Check" description="Scheduler status, provider readiness, queue health and missing setup. This page tells you exactly what is blocking automation right now." />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label:"Due cases", value: stats.due ?? "—" },
          { label:"Pending jobs", value: stats.pendJobs ?? 0 },
          { label:"Failed jobs", value: stats.failedJobs ?? 0 },
          { label:"Skipped (paid)", value: stats.skippedJobs ?? 0 },
        ].map(c => (
          <Card key={c.label}><CardHeader><CardTitle className="text-xs uppercase text-muted-foreground">{c.label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{c.value}</CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Scheduler</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>Last dispatch: <span className="font-mono">{stats.lastRun ?? "—"}</span></div>
          <div>Endpoint: <code className="bg-muted px-2 py-0.5 rounded">/api/public/scheduler/run</code> <Badge variant="secondary">runs every 5 min via pg_cron</Badge> · gated to 13:00 IST</div>
          <Button onClick={trigger} disabled={busy}>Run scheduler now</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Provider readiness</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Email (SMTP)</span>{status(!!providers.email_smtp_host, "missing")}</div>
          <div className="flex justify-between"><span>WhatsApp (Com.bot v{providers.whatsapp_api_version ?? "19.0"})</span>{status(!!providers.whatsapp_token, "missing")}</div>
          <div className="flex justify-between"><span>SMS</span>{status(!!providers.sms_api_key, "missing")}</div>
          <div className="flex justify-between"><span>AI Copilot</span>{status(providers.ai_enabled !== false, "disabled")}</div>
          <div className="flex justify-between"><span>Internal responsible persons</span>{status(persons > 0, "none added")}</div>
          <div className="flex justify-between"><span>Message templates</span>{status(tplCount > 0, "none seeded")}</div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader><CardTitle className="text-base text-warning-foreground">Warnings</CardTitle></CardHeader>
          <CardContent><ul className="text-sm space-y-1">{warnings.map(w=><li key={w}>• {w}</li>)}</ul></CardContent>
        </Card>
      )}
    </div>
  );
}
