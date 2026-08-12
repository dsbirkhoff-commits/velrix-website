/**
 * Consolidated portal router — item-level endpoints (GET/PUT/DELETE on a
 * specific :id). See ../[resource].js for the full explanation of why
 * this consolidation exists (Vercel Hobby's 12-function limit) and the
 * guarantee that every branch's logic is copied verbatim from the
 * original single-purpose files, not rewritten.
 *
 * Routes handled here:
 *   PUT/DELETE      /api/portal/services/:id
 *   GET/PUT/DELETE  /api/portal/customers/:id
 *
 * The explicit .eq("organization_id", organizationId) on every query
 * below is the same critical, already-tested double-check from the
 * original api/services/[id].js and api/customers/[id].js — this is
 * what stops a guessed/spoofed :id from ever touching another
 * organization's row, independent of RLS.
 */
import { getServiceClient } from "../../_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "../../_orgAuth.js";

async function handleServiceItem(req, res, supabase, organizationId, id) {
  if (req.method === "PUT") {
    const body = req.body || {};
    const updates = {};
    if (body.naam !== undefined) updates.naam = String(body.naam).trim();
    if (body.beschrijving !== undefined) updates.beschrijving = body.beschrijving;
    if (body.prijs !== undefined) updates.prijs = body.prijs === "" ? null : Number(body.prijs);
    if (body.afspraakduur_minuten !== undefined) updates.afspraakduur_minuten = Number(body.afspraakduur_minuten);
    if (body.actief !== undefined) updates.actief = Boolean(body.actief);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("services").update(updates).eq("id", id).eq("organization_id", organizationId).select().maybeSingle();
    if (error) {
      console.error("PUT /api/portal/services/[id] error:", error);
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
    const { error, count } = await supabase.from("services").delete({ count: "exact" }).eq("id", id).eq("organization_id", organizationId);
    if (error) {
      console.error("DELETE /api/portal/services/[id] error:", error);
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

async function handleCustomerItem(req, res, supabase, organizationId, id) {
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

    const { data, error } = await supabase.from("customers").update(updates).eq("id", id).eq("organization_id", organizationId).select().maybeSingle();
    if (error) {
      console.error("PUT /api/portal/customers/[id] error:", error);
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
      console.error("DELETE /api/portal/customers/[id] error:", error);
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

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const { resource, id } = req.query || {};
  if (!id) {
    res.status(400).json({ error: "Ontbrekend id." });
    return;
  }

  const supabase = await getServiceClient();

  if (resource === "services") {
    await handleServiceItem(req, res, supabase, organizationId, id);
    return;
  }
  if (resource === "customers") {
    await handleCustomerItem(req, res, supabase, organizationId, id);
    return;
  }

  res.status(404).json({ error: "Onbekende resource." });
}
