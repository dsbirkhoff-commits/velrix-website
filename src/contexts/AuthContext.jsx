import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Provides the signed-in Supabase session plus the user's organization
 * (via memberships) to the whole dashboard. This is a UX convenience for
 * routing/rendering only — it is NOT the security boundary. The real
 * security boundary is Row Level Security in Postgres (see
 * /supabase/migrations/0001_init.sql): even if this context were somehow
 * wrong or bypassed, Supabase itself would still refuse to return another
 * organization's rows to this user's session.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [membership, setMembership] = useState(null); // { organization_id, role, organizations: { name } }
  const [loadingMembership, setLoadingMembership] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMembership() {
      if (!session?.user) {
        setMembership(null);
        return;
      }
      setLoadingMembership(true);
      // RLS on memberships already limits this to the current user's own
      // rows (memberships_select_same_org policy) — no need to filter by
      // user_id here ourselves, though it doesn't hurt to be explicit.
      const { data, error } = await supabase
        .from("memberships")
        .select("organization_id, role, organizations ( id, name )")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        if (error) console.error("Kon organisatie niet laden:", error);
        setMembership(data || null);
        setLoadingMembership(false);
      }
    }
    loadMembership();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, membership, loadingMembership, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
