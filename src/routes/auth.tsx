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
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen grid place-items-center bg-hero px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <Card className="w-full max-w-md relative glass shadow-elegant border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="sr-only">Sign in to TalentFlow</h1>
          <CardTitle className="font-display text-2xl tracking-tight">Revenue Engine</CardTitle>
          <p className="text-sm text-muted-foreground">Welcome back. Sign in to your workspace.</p>
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
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div><Label htmlFor={signUpNameId}>Full name</Label><Input id={signUpNameId} required value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><Label htmlFor={signUpEmailId}>Email</Label><Input id={signUpEmailId} type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label htmlFor={signUpPwId}>Password</Label><Input id={signUpPwId} type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground transition-colors">← Back home</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
