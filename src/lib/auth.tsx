import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = { id: string; full_name: string | null; company_id: string | null };
type Role = string;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string | undefined) => {
    if (!uid) { setProfile(null); setRoles([]); return; }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,company_id").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(p ?? null);
    setRoles((r ?? []).map((x: any) => x.role));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      setTimeout(() => loadExtras(s?.user?.id), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session); setUser(data.session?.user ?? null);
      await loadExtras(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      user, session, profile, roles, loading,
      refresh: () => loadExtras(user?.id),
      signOut: async () => { await supabase.auth.signOut(); },
    }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};
