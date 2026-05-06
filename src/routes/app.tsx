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
    const [brand, setBrand] = useState("");
    const createCompany = async (e: React.FormEvent) => {
      e.preventDefault(); setBusy(true);
      const { error } = await supabase.rpc("create_workspace", { company_name: name, brand_name: brand || undefined });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await refresh();
      toast.success("Workspace created");
    };
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-accent/30 px-4">
        <Card className="w-full max-w-lg border-border/60 shadow-xl">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
            <CardTitle className="mt-3 text-2xl">Create your company workspace</CardTitle>
            <p className="text-sm text-muted-foreground">TalentFlow Revenue Engine — every workspace is fully tenant-isolated.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCompany} className="space-y-4">
              <div><Label>Company legal name *</Label><Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Acme Recruitment Pvt Ltd" /></div>
              <div><Label>Brand name (optional)</Label><Input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Acme Talent" /></div>
              <Button type="submit" className="w-full" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Continue to dashboard"}</Button>
              <p className="text-xs text-muted-foreground">By continuing you become the admin. You can invite teammates later from Settings.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AppShell><Outlet /></AppShell>;
}
