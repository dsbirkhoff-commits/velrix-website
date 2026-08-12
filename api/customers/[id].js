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
    if (body.kenteken !== undefined) updates.kenteken = body.kenteken;
    if (body.voertuig_merk !== undefined) updates.voertuig_merk = body.voertuig_merk;
    if (body.voertuig_model !== undefined) updates.voertuig_model = body.voertuig_model;
    if (body.bouwjaar !== undefined) updates.bouwjaar = body.bouwjaar ? Number(body.bouwjaar) : null;
    if (body.notities !== undefined) updates.notities = body.notities;
    if (body.status !== undefined) updates.status = body.status;

    // KRITIEK: .eq("organization_id", organizationId) — expliciete,
    // server-side dubbele controle, niet alleen RLS. Zie api/services/[id].js
    // voor dezelfde, al eerder geteste beveiligingsredenering.
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

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
    const { error, count } = await supabase
      .from("customers")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organizationId);

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
