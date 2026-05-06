import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon, title, description, ctaLabel, ctaTo, onCta, secondary,
}: {
  icon: LucideIcon; title: string; description: string;
  ctaLabel?: string; ctaTo?: string; onCta?: () => void;
  secondary?: { label: string; items: string[] };
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent text-primary grid place-items-center mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
        {(ctaLabel && (ctaTo || onCta)) && (
          <div className="mt-5">
            {ctaTo ? (
              <Button asChild><Link to={ctaTo}>{ctaLabel}</Link></Button>
            ) : (
              <Button onClick={onCta}>{ctaLabel}</Button>
            )}
          </div>
        )}
        {secondary && (
          <div className="mt-8 text-left max-w-md mx-auto">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{secondary.label}</div>
            <ul className="space-y-1 text-sm">
              {secondary.items.map(i => <li key={i} className="flex gap-2"><span className="text-primary">›</span>{i}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StageBadge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default"|"success"|"warning"|"destructive"|"muted" }) {
  const map: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/15 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}
