/**
 * GET    /api/customers               -> lijst
 * POST   /api/customers                -> aanmaken
 * PUT    /api/customers?id=<id>        -> bijwerken
 * DELETE /api/customers?id=<id>        -> verwijderen
 *
 * PUT/DELETE gebruiken bewust een query-parameter (?id=) in plaats van
 * een dynamisch /api/customers/[id]-bestand. Reden (zie chat): drie
 * opeenvolgende, op documentatie gebaseerde vercel.json-aanpassingen
 * losten een aanhoudende HTTP 405 op de dynamische bracket-route niet
 * op (één brak zelfs de build). In plaats van nogmaals te gokken op hoe
 * Vercel dynamische bestanden registreert, draait alles nu via dit ene,
 * al bewezen werkende platte bestand — hetzelfde bestand dat GET/POST
 * altijd al correct heeft afgehandeld.
 *
 * De PUT/DELETE-logica hieronder is woordelijk overgenomen uit het
 * voormalige api/customers/[id].js — inclusief de kritieke, expliciete
 * dubbele organization_id-check op elke query. Dat bestand bestaat niet
 * meer; alle klant-item-acties lopen voortaan via dit bestand.
 */
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

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) {
      res.status(400).json({ error: "Ontbrekend id." });
      return;
    }
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
      // FIX: deze pre-fetch had eerder geen enkele foutafhandeling — noch
      // try/catch, noch een check op het teruggegeven error-veld. Als
      // deze specifieke aanroep faalde, crashte de hele PUT ongevangen.
      // Nu dezelfde bescherming als de schema-fetch hierboven.
      let existing;
      try {
        const existingResult = await supabase.from("customers").select("custom_fields").eq("id", id).eq("organization_id", organizationId).maybeSingle();
        if (existingResult.error) throw existingResult.error;
        existing = existingResult.data;
      } catch (fetchError) {
        console.error("PUT /api/customers — kon bestaande custom_fields niet ophalen:", fetchError);
        res.status(500).json({ error: "Bijwerken mislukt: kon bestaande gegevens niet ophalen." });
        return;
      }
      updates.custom_fields = { ...(existing?.custom_fields || {}), ...result.cleaned };
    }

    updates.updated_at = new Date().toISOString();

    // KRITIEK, ongewijzigd overgenomen: expliciete dubbele organization_id-
    // check op de klant-RIJ zelf, niet alleen RLS — dit is wat een ID van
    // een andere organisatie tegenhoudt, ongeacht of iemand het raadt.
    const { data, error } = await supabase.from("customers").update(updates).eq("id", id).eq("organization_id", organizationId).select().maybeSingle();
    if (error) {
      console.error("PUT /api/customers error:", error);
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
    const { id } = req.query || {};
    if (!id) {
      res.status(400).json({ error: "Ontbrekend id." });
      return;
    }
    const { error, count } = await supabase.from("customers").delete({ count: "exact" }).eq("id", id).eq("organization_id", organizationId);
    if (error) {
      console.error("DELETE /api/customers error:", error);
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
