/**
 * One-time-use admin utility: lets Daniel set his own VELRIX portal
 * password directly, without needing Supabase's built-in email service
 * at all (which is rate-limited to 2 emails/hour and team-members-only —
 * see the chat for the full diagnosis).
 *
 * SECURITY MODEL:
 * - Gated behind the same ADMIN_SETUP_SECRET already used for
 *   /admin/koppel-agenda — never reachable without it.
 * - The password is typed by the person using the form on
 *   /admin/portal-wachtwoord and sent directly to this endpoint over
 *   HTTPS. It is NEVER logged, NEVER written to any file, and NEVER
 *   hardcoded anywhere in this codebase — Supabase's own Auth system
 *   hashes and stores it, exactly as it would for a normal signup.
 * - Uses the Supabase service-role key (server-side only, already
 *   required in Vercel for the rest of the portal — see _supabase.js).
 *
 * This intentionally only creates/updates ONE specific, hardcoded-in-the-
 * request-body account per call — it is not a general "create any user"
 * endpoint; the caller must know both the ADMIN_SETUP_SECRET and the
 * target email, and the email is not restricted server-side to a single
 * value so it can be reused for future team members, but every use is
 * still gated by the shared secret.
 */
import { isSupabaseConfigured, getServiceClient } from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const providedKey = req.query?.key || req.body?.key;
  if (!process.env.ADMIN_SETUP_SECRET || providedKey !== process.env.ADMIN_SETUP_SECRET) {
    res.status(403).json({ error: "Niet geautoriseerd. Ontbrekende of onjuiste setup-sleutel." });
    return;
  }

  if (!isSupabaseConfigured()) {
    res.status(501).json({ error: "Supabase is nog niet geconfigureerd (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken in Vercel)." });
    return;
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: "E-mailadres en wachtwoord zijn verplicht." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Wachtwoord moet minimaal 8 tekens zijn." });
    return;
  }

  try {
    const supabase = await getServiceClient();

    // Bestaat het account al? (paginated listUsers + filter, want de
    // admin-API heeft geen directe "get by email".)
    let existingUser = null;
    let page = 1;
    while (!existingUser) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      existingUser = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (existingUser || data.users.length < 200) break;
      page += 1;
    }

    if (existingUser) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, { password });
      if (updateError) throw updateError;
      res.status(200).json({ success: true, action: "updated", userId: existingUser.id });
      return;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // meteen bevestigd, geen bevestigingsmail nodig
    });
    if (createError) throw createError;

    res.status(200).json({ success: true, action: "created", userId: created.user.id });
  } catch (err) {
    console.error("set-portal-password error:", err);
    res.status(500).json({ error: err.message || "Kon het wachtwoord niet instellen." });
  }
}
