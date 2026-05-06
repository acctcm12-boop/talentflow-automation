import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, ShieldCheck, Workflow, Receipt, Bell, BarChart3, Scale, Award, CalendarCheck2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "TalentFlow Revenue Engine — Recruitment to Payment, Automated" },
      { name: "description", content: "Automate interviews, LOI, joining, Performa Invoice, Tax Invoice, payment follow-up and legal escalation from one intelligent dashboard." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/30">
      <header className="border-b border-border/50 backdrop-blur sticky top-0 bg-background/80 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
            <div className="font-semibold">TalentFlow</div>
            <span className="text-xs text-muted-foreground hidden sm:inline">Revenue Engine</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/auth">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
            <Bot className="h-3.5 w-3.5" /> End-to-end automation for recruitment companies
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">
            Automate Recruitment Follow-ups, Joining, Billing &amp; Collections — End to End.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Manage candidates, clients, interviews, LOI, joining confirmation, Performa Invoice, Tax Invoice,
            payment follow-up and legal escalation from one intelligent dashboard.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link to="/auth">Get started <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/app">Open dashboard</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: CalendarCheck2, title: "Interview Automation", body: "Confirmations and reminders 24h, 3h, 1h, 30m before — and feedback chase after." },
            { icon: Award, title: "LOI & Joining Tracking", body: "Two-sided joining confirmation. Candidate + client must confirm before billing fires." },
            { icon: Receipt, title: "Billing Automation", body: "Performa Invoice and Tax Invoice tracked separately, with GST and CTC-based billing %." },
            { icon: Workflow, title: "Collection Follow-up", body: "15-stage daily collection flow at 13:00 IST — gentle reminders to court transfer." },
            { icon: ShieldCheck, title: "Payment Stop Rule", body: "Highest-priority rule: marking paid instantly cancels every queued reminder." },
            { icon: Scale, title: "Legal Escalation", body: "Legal notices, advocate letter, MSME, GST, third-party recovery and court transfer." },
            { icon: BarChart3, title: "Reports & Excel Export", body: "Revenue, collection, placement and interview reports — exportable any time." },
            { icon: Bell, title: "Idempotent Dispatch", body: "Unique send keys per case · stage · day · channel · recipient. No duplicates, ever." },
            { icon: Bot, title: "Server-side Scheduler", body: "Runs even when browsers are closed. Re-checks payment status before every send." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border/70 bg-card p-5 hover:shadow-md transition-shadow">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© TalentFlow Revenue Engine</span>
          <span>From Interview to Joining to Payment — Fully Automated.</span>
        </div>
      </footer>
    </div>
  );
}
