import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";
import { getSchemaForOrg, validateCustomFields } from "./_customFields.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("customers").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
    if (error) {
      res.status(500).json({ error: "Kon klanten niet ophalen." });
      return;
    }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const voornaam = (body.voornaam || "").trim();
    const achternaam = (body.achternaam || "").trim();
    if (!voornaam && !achternaam) {
      res.status(400).json({ error: "Voornaam of achternaam is verplicht." });
      return;
    }

    let cleanedCustomFields = {};
    if (body.custom_fields && Object.keys(body.custom_fields).length > 0) {
      let schema;
      try {
        schema = await getSchemaForOrg(supabase, organizationId);
      } catch {
        res.status(500).json({ error: "Kon schema niet controleren." });
        return;
      }
      const result = validateCustomFields(body.custom_fields, schema);
      if (!result.valid) {
        res.status(400).json({ error: result.errors.join(" ") });
        return;
      }
      cleanedCustomFields = result.cleaned;
    }

    const payload = {
      organization_id: organizationId,
      naam: `${voornaam} ${achternaam}`.trim(),
      voornaam: voornaam || null,
      achternaam: achternaam || null,
      email: body.email || null,
      telefoonnummer: body.telefoonnummer || null,
      notities: body.notities || null,
      status: "actief",
      custom_fields: cleanedCustomFields,
    };
    const { data, error } = await supabase.from("customers").insert(payload).select().maybeSingle();
    if (error) {
      console.error("POST /api/customers error:", error);
      res.status(500).json({ error: "Aanmaken mislukt." });
      return;
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
