import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/app/settings")({ component: Settings });

function Settings() {
  const { profile, roles } = useAuth();
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><span className="text-muted-foreground">User:</span> {profile?.full_name}</div>
          <div><span className="text-muted-foreground">Company ID:</span> <code>{profile?.company_id}</code></div>
          <div><span className="text-muted-foreground">Roles:</span> {roles.join(", ") || "—"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Coming next</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Once this MVP foundation (company → client → billing case → workflow → payment-stop → dispatch logging) is verified, we layer on:
          interview &amp; LOI workflows, internal responsible persons, WhatsApp Com.bot v19 provider config, MSME/GST/legal stages,
          template editor, Excel reports, and internal team alerts.
        </CardContent>
      </Card>
    </div>
  );
}
