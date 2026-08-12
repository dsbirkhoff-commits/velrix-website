import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("appointment_settings").select("*").eq("organization_id", organizationId).maybeSingle();
    if (error) {
      res.status(500).json({ error: "Kon afspraakinstellingen niet ophalen." });
      return;
    }
    res.status(200).json(data || { organization_id: organizationId });
    return;
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    const payload = {
      organization_id: organizationId,
      beschikbare_dagen: Array.isArray(body.beschikbare_dagen) ? body.beschikbare_dagen : [1, 2, 3, 4, 5],
      openingstijden: body.openingstijden ?? {},
      standaard_afspraakduur_minuten: Number(body.standaard_afspraakduur_minuten) || 30,
      buffer_minuten: Number(body.buffer_minuten) || 0,
      max_afspraken_per_tijdsblok: Number(body.max_afspraken_per_tijdsblok) || 1,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("appointment_settings")
      .upsert(payload, { onConflict: "organization_id" })
      .select()
      .maybeSingle();
    if (error) {
      console.error("PUT /api/appointment-settings error:", error);
      res.status(500).json({ error: "Opslaan mislukt." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
