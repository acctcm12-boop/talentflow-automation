import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Bot, ShieldCheck, Workflow, Receipt, Bell, BarChart3, Scale, Award, CalendarCheck2, Sparkles, Zap, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "TalentFlow — Recruitment Revenue Automation" },
      { name: "description", content: "Automate interviews, LOI, joining, Performa Invoice, Tax Invoice, payment follow-up and legal escalation from one intelligent dashboard." },
      { property: "og:title", content: "TalentFlow — Recruitment Revenue Automation" },
      { property: "og:description", content: "Automate interviews, joining, billing and collections end-to-end." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TalentFlow",
          description: "End-to-end recruitment, billing and collection automation.",
          publisher: { "@type": "Organization", name: "TalentFlow" },
        }),
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold tracking-tight">TalentFlow</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">Revenue Engine</div>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant">
              <Link to="/auth">Get started <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-accent/40 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-foreground/80 shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              AI-powered automation · Live recruitment cockpit
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Recruitment, billing and{" "}
              <span className="text-gradient">collections — fully automated.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Manage candidates, clients, interviews, LOI, joining confirmation, Performa &amp; Tax Invoice,
              payment follow-up and legal escalation from one intelligent control centre.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant">
                <Link to="/auth">Get started free <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <Link to="/app">Open dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Server-side scheduler", "Payment-stop rule", "Idempotent dispatch", "Multi-tenant RLS"].map(x => (
                <span key={x} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" />{x}</span>
              ))}
            </div>
          </div>

          {/* Floating preview card */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
            <div className="relative glass rounded-2xl p-6 shadow-elegant">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">talentflow.app / cockpit</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Zap className="h-3 w-3 text-primary" /> Live</div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: "Interviews today", value: "12", tone: "from-primary to-primary-glow" },
                  { label: "LOI follow-ups", value: "7", tone: "from-warning to-warning" },
                  { label: "Outstanding", value: "₹4.2L", tone: "from-destructive to-warning" },
                  { label: "Collected (MTD)", value: "₹18.6L", tone: "from-success to-success" },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-border/60 bg-card p-4 hover:-translate-y-0.5 hover:shadow-soft transition-all">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                    <div className="mt-2 text-2xl font-display font-semibold">{k.value}</div>
                    <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${k.tone} opacity-80`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-medium">Built for recruitment teams</div>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold tracking-tight">Everything you need to automate revenue</h2>
          <p className="mt-3 text-muted-foreground">From candidate sourcing to paid invoice — every stage runs itself.</p>
        </div>
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
            { icon: Bot, title: "AI Copilot", body: "Ask anything about your workspace — interviews, billing, collections — in plain English." },
          ].map((f, i) => (
            <div key={i} className="group relative rounded-2xl border border-border/70 bg-card-elevated p-6 hover:shadow-elegant hover:-translate-y-1 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center mb-4 shadow-soft group-hover:shadow-glow transition-shadow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-14 shadow-elegant">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-primary-foreground">
              <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Ready to put revenue on autopilot?</h3>
              <p className="mt-2 opacity-90 max-w-xl">Set up your workspace in under 60 seconds. No credit card required.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="shadow-elegant">
              <Link to="/auth">Start automating <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© TalentFlow Revenue Engine</span>
          <span>From Interview to Joining to Payment — Fully Automated.</span>
        </div>
      </footer>
    </div>
  );
}
