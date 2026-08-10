/**
 * Server-side only. Never imported by any file under /src.
 *
 * Two distinct clients, deliberately kept separate:
 *
 *   getServiceClient() — uses SUPABASE_SERVICE_ROLE_KEY, which BYPASSES
 *   Row Level Security entirely. Extremely powerful, must never reach the
 *   browser. Used only for the one narrow case where there is no signed-in
 *   dashboard user to scope a query to: writing an appointment row after
 *   the PUBLIC booking flow succeeds (an anonymous website visitor has no
 *   Supabase session at all). Every use of this client in this codebase
 *   must hardcode which organization_id it writes to — never derive it
 *   from anything the caller/request controls.
 *
 * Required environment variables (Vercel, server-side only — never
 * prefixed with VITE_, which would expose them to the browser bundle):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (only needed once a second organization exists):
 *   VELRIX_SEED_ORGANIZATION_ID  — the organizations.id row created for
 *     VELRIX itself during setup (see supabase/seed.sql). Until this is
 *     set, the public booking flow's best-effort dashboard sync is
 *     skipped (booking itself still works — see _booking.js).
 */

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getVelrixSeedOrgId() {
  return process.env.VELRIX_SEED_ORGANIZATION_ID || null;
}
