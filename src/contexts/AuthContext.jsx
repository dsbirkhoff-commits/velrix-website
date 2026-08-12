import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Provides the signed-in Supabase session, the user's profile (incl.
 * is_velrix_admin), and their organization (via memberships) to the whole
 * portal. This is a UX convenience for routing/rendering only — it is NOT
 * the security boundary. The real security boundary is Row Level Security
 * in Postgres (see /supabase/migrations/0001_init.sql and
 * 0002_admin_role.sql): even if this context were somehow wrong or
 * bypassed, Supabase itself would still refuse to return another
 * organization's rows to this user's session (unless that user is a real
 * VELRIX admin per the profiles table, enforced the same way).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null); // { is_velrix_admin }
  const [membership, setMembership] = useState(null); // { organization_id, role, organizations: { name } }
  const [loadingMembership, setLoadingMembership] = useState(true); // start op true: we weten pas na de eerste effect-run of er wel/geen membership is — anders is er een moment waarop membership===null en loadingMembership===false lijkt, terwijl het laden nog moet beginnen

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfileAndMembership() {
      if (!session?.user) {
        setProfile(null);
        setMembership(null);
        setLoadingMembership(false);
        return;
      }
      setLoadingMembership(true);

      const [{ data: profileData, error: profileError }, { data: membershipData, error: membershipError }] = await Promise.all([
        supabase.from("profiles").select("is_velrix_admin").eq("id", session.user.id).maybeSingle(),
        // RLS on memberships already limits this to the current user's own
        // rows (memberships_select_same_org_or_admin policy) — no need to
        // filter by user_id here ourselves, though it doesn't hurt to be
        // explicit. For a VELRIX admin without any membership row at all,
        // this simply returns null, which the UI handles gracefully.
        supabase
          .from("memberships")
          .select("organization_id, role, organizations ( id, name )")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true }) // deterministic: oudste lidmaatschap eerst, i.p.v. willekeurige databasevolgorde als iemand ooit bij meerdere organisaties hoort
          .limit(1)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        if (profileError) console.error("Kon profiel niet laden:", profileError);
        if (membershipError) console.error("Kon organisatie niet laden:", membershipError);
        setProfile(profileData || { is_velrix_admin: false });
        setMembership(membershipData || null);
        setLoadingMembership(false);
      }
    }
    loadProfileAndMembership();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isVelrixAdmin: Boolean(profile?.is_velrix_admin),
        membership,
        loadingMembership,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
