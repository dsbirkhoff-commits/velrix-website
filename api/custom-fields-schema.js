/**
 * GET  /api/custom-fields-schema                          -> eigen organisatie-schema
 * GET  /api/custom-fields-schema?organization_id=<id>      -> alleen voor admin, elke organisatie
 * PUT  /api/custom-fields-schema                           -> alleen voor admin, body.organization_id verplicht
 *
 * Zoals expliciet afgesproken: alleen VELRIX-admin mag SCHRIJVEN.
 * Een gewone organisatie-gebruiker mag alleen haar EIGEN schema LEZEN
 * (om het klantformulier te kunnen renderen) — nooit wijzigen, nooit een
 * andere organisatie's schema opvragen.
 */
import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  if (!auth) {
    res.status(401).json({ error: "Niet geautoriseerd." });
    return;
  }

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    // Alleen een admin mag een ANDERE organisatie's schema opvragen
    // (bijv. om het voor die klant in te richten). Een gewone gebruiker
    // krijgt altijd en uitsluitend haar eigen, server-side opgeloste
    // organizationId — een ?organization_id in de query van een
    // niet-admin wordt genegeerd, nooit vertrouwd.
    const targetOrgId = auth.isAdmin && req.query?.organization_id ? req.query.organization_id : auth.organizationId;
    if (!targetOrgId) {
      res.status(400).json({ error: "Geen organisatie opgegeven." });
      return;
    }
    const { data, error } = await supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("organization_id", targetOrgId)
      .eq("entity_type", "customer")
      .order("sort_order", { ascending: true });
    if (error) {
      res.status(500).json({ error: "Kon schema niet ophalen." });
      return;
    }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "PUT") {
    if (!auth.isAdmin) {
      res.status(403).json({ error: "Alleen VELRIX-admin mag het schema wijzigen." });
      return;
    }
    const body = req.body || {};
    const targetOrgId = body.organization_id;
    if (!targetOrgId) {
      res.status(400).json({ error: "organization_id is verplicht." });
      return;
    }
    const fields = Array.isArray(body.fields) ? body.fields : [];

    const { error: deleteError } = await supabase
      .from("custom_field_definitions")
      .delete()
      .eq("organization_id", targetOrgId)
      .eq("entity_type", "customer");
    if (deleteError) {
      console.error("PUT /api/custom-fields-schema delete error:", deleteError);
      res.status(500).json({ error: "Bijwerken mislukt." });
      return;
    }

    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        organization_id: targetOrgId,
        entity_type: "customer",
        field_key: f.field_key,
        label: f.label,
        data_type: f.data_type,
        required: Boolean(f.required),
        options: f.options ?? null,
        validation: f.validation ?? null,
        sort_order: f.sort_order ?? i,
        visible: f.visible !== undefined ? Boolean(f.visible) : true,
      }));
      const { error: insertError } = await supabase.from("custom_field_definitions").insert(rows);
      if (insertError) {
        console.error("PUT /api/custom-fields-schema insert error:", insertError);
        res.status(500).json({ error: "Bijwerken mislukt." });
        return;
      }
    }

    const { data } = await supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("organization_id", targetOrgId)
      .eq("entity_type", "customer")
      .order("sort_order", { ascending: true });
    res.status(200).json(data || []);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
