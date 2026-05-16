import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — TalentFlow" },
      { name: "description", content: "Sign in or create your TalentFlow workspace to automate recruitment, billing and collections." },
      { property: "og:title", content: "Sign in — TalentFlow" },
      { property: "og:description", content: "Access your TalentFlow recruitment automation workspace." },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) nav({ to: "/app" }); }, [user, loading, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message); else nav({ to: "/app" });
  };
  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/app`, data: { full_name: name } },
    });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Account created"); nav({ to: "/app" }); }
  };

  const signInEmailId = useId();
  const signInPwId = useId();
  const signUpNameId = useId();
  const signUpEmailId = useId();
  const signUpPwId = useId();

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="sr-only">Sign in to TalentFlow</h1>
          <CardTitle>Revenue Engine</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your workspace.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 mt-4">
                <div><Label htmlFor={signInEmailId}>Email</Label><Input id={signInEmailId} type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label htmlFor={signInPwId}>Password</Label><Input id={signInPwId} type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div><Label htmlFor={signUpNameId}>Full name</Label><Input id={signUpNameId} required value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><Label htmlFor={signUpEmailId}>Email</Label><Input id={signUpEmailId} type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label htmlFor={signUpPwId}>Password</Label><Input id={signUpPwId} type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center text-xs text-muted-foreground"><Link to="/">← Back home</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
