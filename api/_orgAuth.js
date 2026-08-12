/**
 * Server-side only. Shared authorization for the Fase 2 "API-first"
 * portal endpoints (organization/services/appointment-settings/
 * ai-settings).
 *
 * THE ACTUAL SECURITY GUARANTEE, stated plainly: every endpoint that uses
 * resolveOrgFromRequest() gets the organization_id by looking it up
 * SERVER-SIDE from the caller's own membership row — never from anything
 * the client sent (query params, body, headers). A request body may
 * contain an "organization_id" field for other reasons, but it is never
 * read for authorization purposes anywhere in this file or its callers.
 * Combined with Postgres RLS (still enabled on every table below, as
 * defense-in-depth), this means a spoofed organization_id in a request
 * simply has no effect — the server always uses its own resolved value.
 *
 * Flow:
 *   1. Extract the Supabase access token from "Authorization: Bearer ...".
 *   2. Verify it via the service-role client's auth.getUser(token) —
 *      confirms the token is genuine and gets the real user id.
 *   3. Look up that user's membership row (service-role, so RLS doesn't
 *      apply to this specific lookup — it's the one trusted place that
 *      resolves "who is this, and what org are they actually in").
 *   4. Return { userId, organizationId, role, isAdmin } for the caller to
 *      use in every subsequent query.
 *
 * Returns null if the token is missing/invalid, or if the user has no
 * membership and isn't a VELRIX admin — callers must treat null as 401/403.
 */
import { getServiceClient } from "./_supabase.js";

export async function resolveOrgFromRequest(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const supabase = await getServiceClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return null;
  const userId = userData.user.id;

  const { data: profile } = await supabase.from("profiles").select("is_velrix_admin").eq("id", userId).maybeSingle();
  const isAdmin = Boolean(profile?.is_velrix_admin);

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership && !isAdmin) return null;

  return {
    userId,
    organizationId: membership?.organization_id || null,
    role: membership?.role || null,
    isAdmin,
  };
}

/** Small helper so every endpoint handles the "no valid org" case identically. */
export function requireOrg(auth, res) {
  if (!auth || (!auth.organizationId && !auth.isAdmin)) {
    res.status(401).json({ error: "Niet geautoriseerd of geen organisatie gekoppeld." });
    return null;
  }
  if (!auth.organizationId) {
    // A VELRIX admin with no membership has nothing org-scoped to act on
    // via these endpoints (which are for a specific garage's own data).
    res.status(400).json({ error: "Dit account is niet aan een organisatie gekoppeld." });
    return null;
  }
  return auth.organizationId;
}
