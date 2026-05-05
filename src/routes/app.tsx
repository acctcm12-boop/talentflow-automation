import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { user, loading, profile, refresh } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  if (profile && !profile.company_id) {
    const createCompany = async (e: React.FormEvent) => {
      e.preventDefault(); setBusy(true);
      const { data: c, error } = await supabase.from("companies").insert({ name }).select().single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      const [{ error: pErr }, { error: rErr }] = await Promise.all([
        supabase.from("profiles").update({ company_id: c.id }).eq("id", user.id),
        supabase.from("user_roles").insert({ user_id: user.id, role: "company_admin", company_id: c.id }),
      ]);
      setBusy(false);
      if (pErr || rErr) { toast.error((pErr ?? rErr)?.message ?? "Failed"); return; }
      await refresh();
      toast.success("Workspace created");
    };
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Create your workspace</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createCompany} className="space-y-3">
              <div><Label>Company name</Label><Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Acme Recruitment Pvt Ltd" /></div>
              <Button type="submit" className="w-full" disabled={busy}>Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AppShell><Outlet /></AppShell>;
}
