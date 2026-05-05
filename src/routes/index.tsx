import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, ShieldCheck, Workflow, Receipt, Bell, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">Revenue Engine</div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/auth">Get started</Link></Button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
            <Bot className="h-3.5 w-3.5" /> Server-side automation engine
          </div>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight">Turn placements into paid invoices, automatically.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            From candidate joining to tax invoice, collection follow-ups, legal escalation and payment closure —
            run by a single tenant-isolated automation engine with strict payment-stop rules and idempotent dispatch.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link to="/auth">Open dashboard <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
          </div>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Workflow, title: "Stage-aware workflow", body: "15-stage collection workflow tied to invoice due date with mid-stage cancel on payment." },
            { icon: ShieldCheck, title: "Payment-stop priority", body: "Highest-priority rule: payment received instantly cancels every queued reminder." },
            { icon: Receipt, title: "Performa & Tax invoices", body: "Distinct Performa Invoice and Tax Invoice tracking with explicit payment status." },
            { icon: Bell, title: "Idempotent dispatch", body: "Unique send keys per case, stage, channel and day — no duplicate reminders, ever." },
            { icon: BarChart3, title: "Dispatch logs", body: "Every send is logged with template, recipient, status and error for full audit trail." },
            { icon: Bot, title: "Server-side scheduler", body: "Runs even when browsers are closed. Re-checks payment & pause state before every send." },
          ].map((f, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
