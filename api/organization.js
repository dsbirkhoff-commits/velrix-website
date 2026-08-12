import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

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
