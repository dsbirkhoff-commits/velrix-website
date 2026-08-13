import { getServiceClient } from "../_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "../_orgAuth.js";
import { getSchemaForOrg, validateCustomFields } from "../_customFields.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const { id } = req.query || {};
  if (!id) {
    res.status(400).json({ error: "Ontbrekend id." });
    return;
  }

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).eq("organization_id", organizationId).maybeSingle();
    if (error) {
      res.status(500).json({ error: "Kon klant niet ophalen." });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Klant niet gevonden." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    const updates = {};
    if (body.voornaam !== undefined) updates.voornaam = body.voornaam;
    if (body.achternaam !== undefined) updates.achternaam = body.achternaam;
    if (body.voornaam !== undefined || body.achternaam !== undefined) {
      updates.naam = `${body.voornaam || ""} ${body.achternaam || ""}`.trim();
    }
    if (body.email !== undefined) updates.email = body.email;
    if (body.telefoonnummer !== undefined) updates.telefoonnummer = body.telefoonnummer;
    if (body.notities !== undefined) updates.notities = body.notities;
    if (body.status !== undefined) updates.status = body.status;

    if (body.custom_fields !== undefined) {
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
      // Merge i.p.v. overschrijven, zodat een gedeeltelijke update van
      // custom_fields niet per ongeluk andere, niet-meegestuurde velden wist.
      const { data: existing } = await supabase.from("customers").select("custom_fields").eq("id", id).eq("organization_id", organizationId).maybeSingle();
      updates.custom_fields = { ...(existing?.custom_fields || {}), ...result.cleaned };
    }

    updates.updated_at = new Date().toISOString();

    // KRITIEK, zelfde bewezen patroon als elders: expliciete dubbele
    // organization_id-check, niet alleen RLS.
    const { data, error } = await supabase.from("customers").update(updates).eq("id", id).eq("organization_id", organizationId).select().maybeSingle();
    if (error) {
      console.error("PUT /api/customers/[id] error:", error);
      res.status(500).json({ error: "Bijwerken mislukt." });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Klant niet gevonden." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { error, count } = await supabase.from("customers").delete({ count: "exact" }).eq("id", id).eq("organization_id", organizationId);
    if (error) {
      console.error("DELETE /api/customers/[id] error:", error);
      res.status(500).json({ error: "Verwijderen mislukt." });
      return;
    }
    if (!count) {
      res.status(404).json({ error: "Klant niet gevonden." });
      return;
    }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
