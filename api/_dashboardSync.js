/**
 * Server-side only. Best-effort sync from the PUBLIC booking flow into
 * the Supabase-backed customer dashboard, so the (currently single) VELRIX
 * organization sees real bookings on its own /dashboard/appointments and
 * /dashboard/customers pages.
 *
 * Deliberately best-effort and non-blocking: if Supabase isn't configured,
 * or this write fails for any reason, the public booking flow must still
 * succeed — the Google Calendar event is the source of truth for the
 * booking itself; this is purely a secondary read-model for the dashboard.
 * Never throws.
 */
import { isSupabaseConfigured, getServiceClient, getVelrixSeedOrgId } from "./_supabase.js";

export async function syncBookingToDashboard({ dateISO, time, name, email, googleEventId }) {
  if (!isSupabaseConfigured()) return { synced: false, reason: "not_configured" };

  const organizationId = getVelrixSeedOrgId();
  if (!organizationId) return { synced: false, reason: "no_seed_org" };

  try {
    const supabase = await getServiceClient();

    // 1. Record the appointment itself.
    const { error: apptError } = await supabase.from("appointments").insert({
      organization_id: organizationId,
      datum: dateISO,
      tijd: time,
      klantnaam: name,
      email,
      type: "Gratis kennismaking",
      status: "bevestigd",
      google_event_id: googleEventId || null,
    });
    if (apptError) throw apptError;

    // 2. Upsert a matching customer row (best-effort dedupe by org+email),
    //    so /dashboard/customers reflects real bookings without fabricating
    //    anything — only ever written from an actual successful booking.
    if (email) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, aantal_afspraken")
        .eq("organization_id", organizationId)
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customers")
          .update({ laatste_contact: new Date().toISOString(), aantal_afspraken: (existing.aantal_afspraken || 0) + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("customers").insert({
          organization_id: organizationId,
          naam: name,
          email,
          laatste_contact: new Date().toISOString(),
          aantal_afspraken: 1,
          status: "actief",
        });
      }
    }

    return { synced: true };
  } catch (err) {
    console.error("Dashboard sync (best-effort) failed:", err);
    return { synced: false, reason: "error" };
  }
}
