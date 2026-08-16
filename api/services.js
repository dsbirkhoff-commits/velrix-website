/**
 * GET    /api/services                -> lijst
 * POST   /api/services                 -> aanmaken
 * PUT    /api/services?id=<id>         -> bijwerken
 * DELETE /api/services?id=<id>         -> verwijderen
 *
 * PUT/DELETE gebruiken bewust een query-parameter (?id=) in plaats van
 * een dynamisch /api/services/[id]-bestand — zelfde reden en patroon als
 * api/customers.js (zie de uitgebreide toelichting daar). De
 * voormalige api/services/[id].js bestaat niet meer.
 */
import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });
    if (error) {
      res.status(500).json({ error: "Kon diensten niet ophalen." });
      return;
    }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.naam || !body.naam.trim()) {
      res.status(400).json({ error: "Naam is verplicht." });
      return;
    }
    const payload = {
      organization_id: organizationId, // altijd server-side resolved, nooit van de client
      naam: body.naam.trim(),
      beschrijving: body.beschrijving ?? null,
      prijs: body.prijs !== undefined && body.prijs !== "" ? Number(body.prijs) : null,
      afspraakduur_minuten: Number(body.afspraakduur_minuten) || 30,
      actief: body.actief !== undefined ? Boolean(body.actief) : true,
    };
    const { data, error } = await supabase.from("services").insert(payload).select().maybeSingle();
    if (error) {
      console.error("POST /api/services error:", error);
      res.status(500).json({ error: "Aanmaken mislukt." });
      return;
    }
    res.status(201).json(data);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) {
      res.status(400).json({ error: "Ontbrekend id." });
      return;
    }
    const body = req.body || {};
    const updates = {};
    if (body.naam !== undefined) updates.naam = String(body.naam).trim();
    if (body.beschrijving !== undefined) updates.beschrijving = body.beschrijving;
    if (body.prijs !== undefined) updates.prijs = body.prijs === "" ? null : Number(body.prijs);
    if (body.afspraakduur_minuten !== undefined) updates.afspraakduur_minuten = Number(body.afspraakduur_minuten);
    if (body.actief !== undefined) updates.actief = Boolean(body.actief);
    updates.updated_at = new Date().toISOString();

    // KRITIEK, ongewijzigd overgenomen: .eq("organization_id", organizationId)
    // hier is wat een gebruiker tegenhoudt om via een geraden/eigen :id een
    // dienst van een ANDERE organisatie te wijzigen.
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("PUT /api/services error:", error);
      res.status(500).json({ error: "Bijwerken mislukt." });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Dienst niet gevonden." });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {};
    if (!id) {
      res.status(400).json({ error: "Ontbrekend id." });
      return;
    }
    const { error, count } = await supabase
      .from("services")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("DELETE /api/services error:", error);
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
