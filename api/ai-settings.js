import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("ai_settings").select("*").eq("organization_id", organizationId).maybeSingle();
    if (error) {
      res.status(500).json({ error: "Kon AI-instellingen niet ophalen." });
      return;
    }
    res.status(200).json(data || { organization_id: organizationId });
    return;
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    const payload = {
      organization_id: organizationId,
      ai_actief: Boolean(body.ai_actief),
      begroeting: body.begroeting ?? null,
      bedrijfsomschrijving: body.bedrijfsomschrijving ?? null,
      faq: Array.isArray(body.faq) ? body.faq : [],
      toegestane_onderwerpen: body.toegestane_onderwerpen ?? null,
      verboden_onderwerpen: body.verboden_onderwerpen ?? null,
      doorverbinden_wanneer: body.doorverbinden_wanneer ?? null,
      instructies: body.instructies ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("ai_settings")
      .upsert(payload, { onConflict: "organization_id" })
      .select()
      .maybeSingle();
    if (error) {
      console.error("PUT /api/ai-settings error:", error);
      res.status(500).json({ error: "Opslaan mislukt." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
