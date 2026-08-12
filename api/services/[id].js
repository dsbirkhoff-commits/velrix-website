import { getServiceClient } from "../_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "../_orgAuth.js";

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

  if (req.method === "PUT") {
    const body = req.body || {};
    const updates = {};
    if (body.naam !== undefined) updates.naam = String(body.naam).trim();
    if (body.beschrijving !== undefined) updates.beschrijving = body.beschrijving;
    if (body.prijs !== undefined) updates.prijs = body.prijs === "" ? null : Number(body.prijs);
    if (body.afspraakduur_minuten !== undefined) updates.afspraakduur_minuten = Number(body.afspraakduur_minuten);
    if (body.actief !== undefined) updates.actief = Boolean(body.actief);
    updates.updated_at = new Date().toISOString();

    // KRITIEK: .eq("organization_id", organizationId) hier is wat een
    // gebruiker tegenhoudt om via een geraden/eigen :id een dienst van
    // een ANDERE organisatie te wijzigen — zonder deze regel zou het
    // enkel op id filteren, en zou RLS de enige verdediging zijn i.p.v.
    // een expliciete, server-side dubbele controle.
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("PUT /api/services/[id] error:", error);
      res.status(500).json({ error: "Bijwerken mislukt." });
      return;
    }
    if (!data) {
      // Bestaat niet, of bestaat wel maar hoort bij een andere organisatie
      // — in beide gevallen hetzelfde antwoord, om niet te verklappen
      // welke van de twee het is.
      res.status(404).json({ error: "Dienst niet gevonden." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { error, count } = await supabase
      .from("services")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("DELETE /api/services/[id] error:", error);
      res.status(500).json({ error: "Verwijderen mislukt." });
      return;
    }
    if (!count) {
      res.status(404).json({ error: "Dienst niet gevonden." });
      return;
    }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
