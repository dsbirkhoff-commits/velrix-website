import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

/**
 * KLEINE, GERICHTE UITZONDERING (expliciet zo goedgekeurd — geen bredere
 * API-consolidatie): dit bestand serveert normaal alleen
 * organization_settings, maar krijgt er hier één extra, nauw afgebakende
 * tak bij voor GET /api/organization?resource=invoices — puur omdat de
 * portal-API al op de Vercel Hobby-limiet van 12 functions zat, en een
 * apart api/invoices.js-bestand die limiet zou overschrijden. Geen
 * generieke router, geen ander gedrag voor organization_settings zelf.
 */
export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET" && req.query?.resource === "invoices") {
    // Alleen-lezen, zoals bedoeld: garages kunnen zelf geen facturen
    // aanmaken/wijzigen (zie RLS-policies op invoices in
    // supabase/migrations/0004_fase2_fixes.sql — insert/update/delete
    // is daar al uitsluitend voor is_velrix_admin()).
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .order("issue_date", { ascending: false });
    if (error) {
      res.status(500).json({ error: "Kon facturen niet ophalen." });
      return;
    }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await supabase.from("organization_settings").select("*").eq("organization_id", organizationId).maybeSingle();
    if (error) {
      res.status(500).json({ error: "Kon bedrijfsprofiel niet ophalen." });
      return;
    }
    res.status(200).json(data || { organization_id: organizationId });
    return;
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    // Whitelist: alleen deze velden mogen ooit geschreven worden, en
    // organization_id komt altijd van de server-side resolutie hierboven
    // — nooit van iets dat de client meestuurt.
    const payload = {
      organization_id: organizationId,
      bedrijfsnaam: body.bedrijfsnaam ?? null,
      logo_url: body.logo_url ?? null,
      adres: body.adres ?? null,
      postcode: body.postcode ?? null,
      plaats: body.plaats ?? null,
      email: body.email ?? null,
      openingstijden: body.openingstijden ?? {},
      tijdzone: body.tijdzone || "Europe/Amsterdam",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("organization_settings")
      .upsert(payload, { onConflict: "organization_id" })
      .select()
      .maybeSingle();
    if (error) {
      console.error("PUT /api/organization error:", error);
      res.status(500).json({ error: "Opslaan mislukt." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
