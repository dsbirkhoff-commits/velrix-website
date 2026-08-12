/**
 * Consolidated portal router — collection/single-object endpoints.
 *
 * WHY THIS FILE EXISTS: Vercel's Hobby plan caps a deployment at 12
 * Serverless Functions. Nine separate Fase 2 route files pushed the
 * project to 13. Consolidating those nine into these two dynamic router
 * files (this one + [resource]/[id].js) brings the total to 6 —
 * comfortably under the limit, with headroom for future resources.
 *
 * NOTHING about the security model changed: every branch below still
 * calls resolveOrgFromRequest() first and uses ONLY the server-resolved
 * organizationId in every query — never anything the client sends. RLS
 * remains enabled on every table as defense-in-depth, unchanged. The
 * logic in every branch is copied verbatim from the original single-
 * purpose files (api/organization.js, api/appointment-settings.js,
 * api/ai-settings.js, api/services.js, api/customers.js,
 * api/appointments.js, api/invoices.js — all deleted, this replaces
 * them), not rewritten, to minimize the chance of introducing a new bug
 * during consolidation.
 *
 * Routes handled here (dispatched on the [resource] URL segment):
 *   GET/PUT  /api/portal/organization
 *   GET/PUT  /api/portal/appointment-settings
 *   GET/PUT  /api/portal/ai-settings
 *   GET/POST /api/portal/services
 *   GET/POST /api/portal/customers
 *   GET      /api/portal/appointments   (read-only, see original file's comment)
 *   GET      /api/portal/invoices       (read-only, see original file's comment)
 *
 * Item-level operations (GET/PUT/DELETE on a specific :id, for services
 * and customers only) live in api/portal/[resource]/[id].js.
 */
import { getServiceClient } from "../_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "../_orgAuth.js";

// "Single object per organization" resources: GET returns one row (or a
// bare {organization_id} if none exists yet), PUT upserts. Identical
// shape to the original organization.js / appointment-settings.js /
// ai-settings.js.
const SIMPLE_RESOURCES = {
  organization: {
    table: "organization_settings",
    notFoundMsg: "Kon bedrijfsprofiel niet ophalen.",
    saveErrorMsg: "Opslaan mislukt.",
    buildPayload: (body, organizationId) => ({
      organization_id: organizationId,
      bedrijfsnaam: body.bedrijfsnaam ?? null,
      logo_url: body.logo_url ?? null,
      adres: body.adres ?? null,
      postcode: body.postcode ?? null,
      plaats: body.plaats ?? null,
      email: body.email ?? null,
      openingstijden: body.openingstijden ?? {},
      tijdzone: body.tijdzone || "Europe/Amsterdam",
      updated_at: new Date().toISOString(),
    }),
  },
  "appointment-settings": {
    table: "appointment_settings",
    notFoundMsg: "Kon afspraakinstellingen niet ophalen.",
    saveErrorMsg: "Opslaan mislukt.",
    buildPayload: (body, organizationId) => ({
      organization_id: organizationId,
      beschikbare_dagen: Array.isArray(body.beschikbare_dagen) ? body.beschikbare_dagen : [1, 2, 3, 4, 5],
      openingstijden: body.openingstijden ?? {},
      standaard_afspraakduur_minuten: Number(body.standaard_afspraakduur_minuten) || 30,
      buffer_minuten: Number(body.buffer_minuten) || 0,
      max_afspraken_per_tijdsblok: Number(body.max_afspraken_per_tijdsblok) || 1,
      updated_at: new Date().toISOString(),
    }),
  },
  "ai-settings": {
    table: "ai_settings",
    notFoundMsg: "Kon AI-instellingen niet ophalen.",
    saveErrorMsg: "Opslaan mislukt.",
    buildPayload: (body, organizationId) => ({
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
    }),
  },
};

async function handleSimpleResource(config, req, res, supabase, organizationId) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from(config.table).select("*").eq("organization_id", organizationId).maybeSingle();
    if (error) {
      res.status(500).json({ error: config.notFoundMsg });
      return;
    }
    res.status(200).json(data || { organization_id: organizationId });
    return;
  }
  if (req.method === "PUT") {
    const payload = config.buildPayload(req.body || {}, organizationId);
    const { data, error } = await supabase.from(config.table).upsert(payload, { onConflict: "organization_id" }).select().maybeSingle();
    if (error) {
      console.error(`PUT /api/portal/${req.query.resource} error:`, error);
      res.status(500).json({ error: config.saveErrorMsg });
      return;
    }
    res.status(200).json(data);
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}

async function handleServicesCollection(req, res, supabase, organizationId) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("services").select("*").eq("organization_id", organizationId).order("created_at", { ascending: true });
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
      organization_id: organizationId,
      naam: body.naam.trim(),
      beschrijving: body.beschrijving ?? null,
      prijs: body.prijs !== undefined && body.prijs !== "" ? Number(body.prijs) : null,
      afspraakduur_minuten: Number(body.afspraakduur_minuten) || 30,
      actief: body.actief !== undefined ? Boolean(body.actief) : true,
    };
    const { data, error } = await supabase.from("services").insert(payload).select().maybeSingle();
    if (error) {
      console.error("POST /api/portal/services error:", error);
      res.status(500).json({ error: "Aanmaken mislukt." });
      return;
    }
    res.status(201).json(data);
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}

async function handleCustomersCollection(req, res, supabase, organizationId) {
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
    const payload = {
      organization_id: organizationId,
      naam: `${voornaam} ${achternaam}`.trim(),
      voornaam: voornaam || null,
      achternaam: achternaam || null,
      email: body.email || null,
      telefoonnummer: body.telefoonnummer || null,
      kenteken: body.kenteken || null,
      voertuig_merk: body.voertuig_merk || null,
      voertuig_model: body.voertuig_model || null,
      bouwjaar: body.bouwjaar ? Number(body.bouwjaar) : null,
      notities: body.notities || null,
      status: "actief",
    };
    const { data, error } = await supabase.from("customers").insert(payload).select().maybeSingle();
    if (error) {
      console.error("POST /api/portal/customers error:", error);
      res.status(500).json({ error: "Aanmaken mislukt." });
      return;
    }
    res.status(201).json(data);
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}

async function handleAppointmentsReadOnly(req, res, supabase, organizationId) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { data, error } = await supabase
    .from("appointments")
    .select("id, datum, tijd, eindtijd, klantnaam, email, telefoonnummer, type, status, notities")
    .eq("organization_id", organizationId)
    .order("datum", { ascending: true })
    .order("tijd", { ascending: true });
  if (error) {
    res.status(500).json({ error: "Kon afspraken niet ophalen." });
    return;
  }
  res.status(200).json(data || []);
}

async function handleInvoicesReadOnly(req, res, supabase, organizationId) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { data, error } = await supabase.from("invoices").select("*").eq("organization_id", organizationId).order("issue_date", { ascending: false });
  if (error) {
    res.status(500).json({ error: "Kon facturen niet ophalen." });
    return;
  }
  res.status(200).json(data || []);
}

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const { resource } = req.query || {};
  const supabase = await getServiceClient();

  if (SIMPLE_RESOURCES[resource]) {
    await handleSimpleResource(SIMPLE_RESOURCES[resource], req, res, supabase, organizationId);
    return;
  }
  if (resource === "services") {
    await handleServicesCollection(req, res, supabase, organizationId);
    return;
  }
  if (resource === "customers") {
    await handleCustomersCollection(req, res, supabase, organizationId);
    return;
  }
  if (resource === "appointments") {
    await handleAppointmentsReadOnly(req, res, supabase, organizationId);
    return;
  }
  if (resource === "invoices") {
    await handleInvoicesReadOnly(req, res, supabase, organizationId);
    return;
  }

  res.status(404).json({ error: "Onbekende resource." });
}
