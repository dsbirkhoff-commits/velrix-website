/**
 * VELRIX Admin Backend — één centraal bestand, alle admin-resources via
 * ?resource=-dispatch. Bewust EEN bestand (niet 2-3), om het totale
 * aantal Vercel Serverless Functions op 11 te houden — één vrije plek
 * onder de Hobby-limiet van 12, in plaats van er exact op te zitten
 * (zoals eerder in dit project, met alle problemen van dien).
 *
 * ELKE resource-tak hieronder controleert zelf, expliciet, is_velrix_admin
 * — geen gedeelde "poort" bovenaan die je bij een nieuwe resource zou
 * kunnen vergeten. Een gewone organisatiegebruiker krijgt overal 403,
 * nooit enige admin-data te zien.
 *
 * Resources: organizations, users, subscriptions, industries,
 * custom-field-templates, customers, appointments, services, ai_settings,
 * invoices, overview.
 */
import { getServiceClient } from "../_supabase.js";
import { resolveOrgFromRequest } from "../_orgAuth.js";

function requireAdmin(auth, res) {
  if (!auth || !auth.isAdmin) {
    res.status(403).json({ error: "Alleen VELRIX-admin heeft toegang." });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// organizations — lijst/detail, aanmaken (volledige onboardingflow),
// bijwerken (naam/branche/status via action: 'activate'|'pause')
// ---------------------------------------------------------------------
/**
 * Stuurt een bestaande, nog niet geaccepteerde invite opnieuw — raakt
 * UITSLUITEND auth.users (via getUserById + inviteUserByEmail) en, puur
 * ter beveiliging, een read-only check op memberships. Maakt NOOIT een
 * nieuwe organisatie, membership, of subscription aan — geen enkel risico
 * op duplicatie, per ontwerp.
 */
async function resendInvite(res, supabase, organizationId, userId) {
  if (!userId) { res.status(400).json({ error: "Ontbrekend user_id." }); return; }

  // Scoping-check: deze user_id moet daadwerkelijk bij DEZE organisatie
  // horen — voorkomt dat een admin per ongeluk (of via een geraden
  // user_id) een invite voor een onverwante organisatie opnieuw verstuurt.
  const { data: membership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!membership) { res.status(404).json({ error: "Gebruiker hoort niet bij deze organisatie." }); return; }

  let user;
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) throw userError;
    user = userData.user;
  } catch (err) {
    console.error("resendInvite — kon gebruiker niet ophalen:", err);
    res.status(500).json({ error: "Kon gebruiker niet ophalen." });
    return;
  }
  if (!user) { res.status(404).json({ error: "Gebruiker niet gevonden." }); return; }

  // Best-effort signaal, niet 100% garandeerd: last_sign_in_at blijft
  // null totdat iemand daadwerkelijk voor het eerst succesvol is
  // ingelogd (zie de chat-analyse voor de kanttekening hierbij).
  if (user.last_sign_in_at) {
    res.status(400).json({ error: "Deze gebruiker is al actief. Gebruik 'Wachtwoord vergeten' om opnieuw toegang te krijgen." });
    return;
  }

  try {
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(user.email, {
      redirectTo: "https://www.velrix.nl/portal/reset-password",
    });
    if (inviteError) throw inviteError;
  } catch (err) {
    console.error("resendInvite — invite opnieuw versturen mislukt:", err);
    res.status(500).json({ error: err.message || "Uitnodiging opnieuw versturen mislukt." });
    return;
  }

  res.status(200).json({ success: true, email: user.email });
}

async function handleOrganizations(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { id } = req.query || {};
    if (id) {
      const { data: org, error } = await supabase.from("organizations").select("*, industries(name, slug)").eq("id", id).maybeSingle();
      if (error) { res.status(500).json({ error: "Kon organisatie niet ophalen." }); return; }
      if (!org) { res.status(404).json({ error: "Organisatie niet gevonden." }); return; }
      const [{ data: memberships }, { data: subscription }, { data: schema }] = await Promise.all([
        supabase.from("memberships").select("user_id, role").eq("organization_id", id),
        supabase.from("subscriptions").select("*").eq("organization_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("custom_field_definitions").select("*").eq("organization_id", id).eq("entity_type", "customer").order("sort_order"),
      ]);
      // Verrijk elke membership met e-mail + laatste-inlog, nodig voor de
      // "Uitnodiging opnieuw sturen"-knop (bevestigingstekst + "is deze
      // gebruiker al actief"-check). memberships zelf bevat geen e-mail
      // (leeft in auth.users) — best-effort per lid opgehaald, faalt
      // een enkel lid nooit de hele pagina.
      const membershipsWithEmail = await Promise.all(
        (memberships || []).map(async (m) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
            return { ...m, email: userData?.user?.email || null, last_sign_in_at: userData?.user?.last_sign_in_at || null };
          } catch {
            return { ...m, email: null, last_sign_in_at: null };
          }
        })
      );
      res.status(200).json({ ...org, memberships: membershipsWithEmail, subscription: subscription || null, custom_fields_schema: schema || [] });
      return;
    }
    const { data, error } = await supabase.from("organizations").select("*, industries(name, slug)").order("created_at", { ascending: false });
    if (error) { res.status(500).json({ error: "Kon organisaties niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    await createOrganization(req, res, supabase);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};

    if (body.action === "resend_invite") {
      await resendInvite(res, supabase, id, body.user_id);
      return;
    }

    const updates = {};
    if (body.action === "activate") updates.status = "actief";
    else if (body.action === "pause") updates.status = "gepauzeerd";
    else if (body.action === "revert_to_concept") updates.status = "concept";
    if (body.name !== undefined) updates.name = body.name;
    if (body.industry_id !== undefined) updates.industry_id = body.industry_id;
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Niets om bij te werken." }); return; }
    const { data, error } = await supabase.from("organizations").update(updates).eq("id", id).select().maybeSingle();
    if (error) { console.error("PUT organizations error:", error); res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    if (!data) { res.status(404).json({ error: "Organisatie niet gevonden." }); return; }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

/**
 * De volledige onboardingflow, met compensatie bij een mislukte stap
 * (geen echte cross-system-transactie mogelijk: Postgres + Supabase Auth
 * zijn twee aparte systemen). Volgorde: organization -> template/custom
 * fields -> subscription -> user invite -> membership. Bij een fout op
 * stap N worden stappen 1..N-1 expliciet teruggedraaid, zodat er nooit
 * een halfwerkende organisatie blijft hangen zonder duidelijke oorzaak.
 */
async function createOrganization(req, res, supabase) {
  const body = req.body || {};
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const industryId = body.industry_id || null;
  const templateId = body.template_id || null;
  const planName = (body.plan_name || "").trim();

  if (!name) { res.status(400).json({ error: "Bedrijfsnaam is verplicht." }); return; }
  if (!email) { res.status(400).json({ error: "E-mailadres is verplicht." }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: "Ongeldig e-mailadres." }); return; }

  // Duplicate-check VOORAF, vóór er iets wordt aangemaakt — voorkomt dat
  // we voor een gegarandeerd-mislukte invite alsnog org/subscription
  // aanmaken en weer moeten opruimen.
  let existingUser = null;
  try {
    let page = 1;
    while (!existingUser) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      existingUser = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
      if (existingUser || data.users.length < 200) break;
      page += 1;
    }
  } catch (checkErr) {
    console.error("createOrganization — duplicate-check faalde:", checkErr);
    res.status(500).json({ error: "Kon niet controleren of dit e-mailadres al bestaat." });
    return;
  }
  if (existingUser) {
    res.status(409).json({ error: "Dit e-mailadres heeft al een VELRIX-account." });
    return;
  }

  // 1. organizations
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, status: "concept", industry_id: industryId })
    .select()
    .maybeSingle();
  if (orgError || !org) {
    console.error("createOrganization — organizations insert faalde:", orgError);
    res.status(500).json({ error: "Organisatie aanmaken mislukt." });
    return;
  }

  // 2. template -> custom_field_definitions (optioneel)
  if (templateId) {
    try {
      const { data: fields, error: fieldsError } = await supabase
        .from("custom_field_template_fields")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });
      if (fieldsError) throw fieldsError;
      if (fields?.length) {
        const rows = fields.map((f) => ({
          organization_id: org.id,
          entity_type: "customer",
          field_key: f.field_key,
          label: f.label,
          data_type: f.data_type,
          required: f.required,
          options: f.options,
          validation: f.validation,
          sort_order: f.sort_order,
          visible: f.visible,
        }));
        const { error: insertFieldsError } = await supabase.from("custom_field_definitions").insert(rows);
        if (insertFieldsError) throw insertFieldsError;
      }
    } catch (templateErr) {
      console.error("createOrganization — template kopiëren faalde, compenseren:", templateErr);
      await supabase.from("organizations").delete().eq("id", org.id);
      res.status(500).json({ error: "Template koppelen mislukt. De organisatie is niet aangemaakt." });
      return;
    }
  }

  // 3. subscription
  const { error: subError } = await supabase.from("subscriptions").insert({
    organization_id: org.id,
    plan_name: planName || "Onbekend",
  });
  if (subError) {
    console.error("createOrganization — subscription insert faalde, compenseren:", subError);
    await supabase.from("custom_field_definitions").delete().eq("organization_id", org.id);
    await supabase.from("organizations").delete().eq("id", org.id);
    res.status(500).json({ error: "Abonnement aanmaken mislukt. De organisatie is niet aangemaakt." });
    return;
  }

  // 4. Supabase Auth invite — server-side, service-role client, nooit
  //    vanuit de frontend bereikbaar.
  let invitedUser;
  try {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://www.velrix.nl/portal/reset-password",
    });
    if (inviteError) throw inviteError;
    invitedUser = inviteData.user;
  } catch (inviteErr) {
    console.error("createOrganization — invite faalde, compenseren:", inviteErr);
    await supabase.from("subscriptions").delete().eq("organization_id", org.id);
    await supabase.from("custom_field_definitions").delete().eq("organization_id", org.id);
    await supabase.from("organizations").delete().eq("id", org.id);
    res.status(500).json({ error: "Uitnodiging versturen mislukt. De organisatie is niet aangemaakt." });
    return;
  }

  // 5. membership
  const { error: memberError } = await supabase.from("memberships").insert({
    user_id: invitedUser.id,
    organization_id: org.id,
    role: "owner",
  });
  if (memberError) {
    console.error("createOrganization — membership insert faalde NA succesvolle invite:", memberError);
    // De uitnodiging is al verstuurd — een Supabase Auth-uitnodiging kan
    // niet veilig worden teruggedraaid zonder het risico een net
    // aangemaakt account van een echte persoon te verwijderen. We
    // compenseren daarom wél alles wat WEL veilig terug te draaien is
    // (organisatie/abonnement/schema), en zijn hier eerlijk over in de
    // foutmelding — dit is een bewust geaccepteerd rest-risico, geen
    // stille inconsistentie.
    await supabase.from("subscriptions").delete().eq("organization_id", org.id);
    await supabase.from("custom_field_definitions").delete().eq("organization_id", org.id);
    await supabase.from("organizations").delete().eq("id", org.id);
    res.status(500).json({
      error: "Koppelen van de gebruiker mislukt. De uitnodiging is al verstuurd naar " + email + ", maar de organisatie is niet aangemaakt — neem contact op met de genodigde vóór je het opnieuw probeert.",
    });
    return;
  }

  res.status(201).json({ ...org, invited_email: email });
}

// ---------------------------------------------------------------------
// users
// ---------------------------------------------------------------------
async function handleUsers(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { organization_id } = req.query || {};
    let query = supabase.from("memberships").select("user_id, role, organization_id, organizations(name)");
    if (organization_id) query = query.eq("organization_id", organization_id);
    const { data, error } = await query;
    if (error) { res.status(500).json({ error: "Kon gebruikers niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {}; // id = user_id
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};
    if (!body.organization_id) { res.status(400).json({ error: "organization_id is verplicht." }); return; }
    const updates = {};
    if (body.role !== undefined) updates.role = body.role;
    const { data, error } = await supabase.from("memberships").update(updates).eq("user_id", id).eq("organization_id", body.organization_id).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    if (!data) { res.status(404).json({ error: "Lidmaatschap niet gevonden." }); return; }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ---------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------
async function handleSubscriptions(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { organization_id } = req.query || {};
    let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    if (organization_id) query = query.eq("organization_id", organization_id);
    const { data, error } = await query;
    if (error) { res.status(500).json({ error: "Kon abonnementen niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.organization_id || !body.plan_name) { res.status(400).json({ error: "organization_id en plan_name zijn verplicht." }); return; }
    const { data, error } = await supabase.from("subscriptions").insert({ organization_id: body.organization_id, plan_name: body.plan_name, notes: body.notes || null }).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Aanmaken mislukt." }); return; }
    res.status(201).json(data);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};
    const updates = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.plan_name !== undefined) updates.plan_name = body.plan_name;
    if (body.notes !== undefined) updates.notes = body.notes;
    const { data, error } = await supabase.from("subscriptions").update(updates).eq("id", id).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    if (!data) { res.status(404).json({ error: "Abonnement niet gevonden." }); return; }
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ---------------------------------------------------------------------
// industries (Branches)
// ---------------------------------------------------------------------
async function handleIndustries(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { data, error } = await supabase.from("industries").select("*").order("sort_order", { ascending: true });
    if (error) { res.status(500).json({ error: "Kon branches niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.name || !body.slug) { res.status(400).json({ error: "Naam en slug zijn verplicht." }); return; }
    const { data, error } = await supabase.from("industries").insert({
      name: body.name.trim(), slug: body.slug.trim(), description: body.description || null,
      active: body.active !== undefined ? Boolean(body.active) : true, sort_order: body.sort_order || 0,
    }).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Aanmaken mislukt (bestaat de slug al?)." }); return; }
    res.status(201).json(data);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    const { data, error } = await supabase.from("industries").update(updates).eq("id", id).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    if (!data) { res.status(404).json({ error: "Branche niet gevonden." }); return; }
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const { error, count } = await supabase.from("industries").delete({ count: "exact" }).eq("id", id);
    if (error) { res.status(500).json({ error: "Verwijderen mislukt." }); return; }
    if (!count) { res.status(404).json({ error: "Branche niet gevonden." }); return; }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ---------------------------------------------------------------------
// custom-field-templates (incl. hun velden, zelfde "vervang de hele
// veldenset"-patroon als het bestaande custom-fields-schema.js)
// ---------------------------------------------------------------------
async function handleTemplates(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { id, industry_id } = req.query || {};
    if (id) {
      const [{ data: template, error }, { data: fields }] = await Promise.all([
        // GEEN "industries(name, slug)"-embed hier — sinds migratie 0008
        // bestaan er TWEE foreign keys tussen custom_field_templates en
        // industries (het bestaande industry_id, én het nieuwe,
        // omgekeerde industries.template_id), wat PostgREST's embed
        // ambigu maakt (PGRST201). Levert sowieso nooit bruikbare data
        // op: alle 10 templates hebben industry_id = null (bewust — de
        // nieuwe standaardtemplate-relatie loopt via
        // industries.template_id, niet andersom).
        supabase.from("custom_field_templates").select("*").eq("id", id).maybeSingle(),
        supabase.from("custom_field_template_fields").select("*").eq("template_id", id).order("sort_order", { ascending: true }),
      ]);
      if (error) { res.status(500).json({ error: "Kon template niet ophalen." }); return; }
      if (!template) { res.status(404).json({ error: "Template niet gevonden." }); return; }
      res.status(200).json({ ...template, fields: fields || [] });
      return;
    }
    // Zelfde reden als hierboven bij de detail-fetch: geen embed, om de
    // PGRST201-ambiguïteit (twee FK's tussen deze twee tabellen sinds
    // migratie 0008) te vermijden.
    let query = supabase.from("custom_field_templates").select("*").order("created_at", { ascending: false });
    if (industry_id) query = query.eq("industry_id", industry_id);
    const { data, error } = await query;
    if (error) { res.status(500).json({ error: "Kon templates niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.name) { res.status(400).json({ error: "Naam is verplicht." }); return; }
    const { data: template, error } = await supabase.from("custom_field_templates").insert({
      name: body.name.trim(), industry_id: body.industry_id || null, active: body.active !== undefined ? Boolean(body.active) : true,
    }).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Aanmaken mislukt." }); return; }
    const fields = Array.isArray(body.fields) ? body.fields : [];
    if (fields.length > 0) {
      const rows = fields.map((f, i) => ({
        template_id: template.id, field_key: f.field_key, label: f.label, data_type: f.data_type,
        required: Boolean(f.required), options: f.options ?? null, validation: f.validation ?? null,
        sort_order: f.sort_order ?? i, visible: f.visible !== undefined ? Boolean(f.visible) : true,
      }));
      const { error: fieldsError } = await supabase.from("custom_field_template_fields").insert(rows);
      if (fieldsError) { res.status(500).json({ error: "Velden opslaan mislukt." }); return; }
    }
    res.status(201).json(template);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.industry_id !== undefined) updates.industry_id = body.industry_id;
    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("custom_field_templates").update(updates).eq("id", id);
      if (error) { res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    }
    if (Array.isArray(body.fields)) {
      const { error: deleteError } = await supabase.from("custom_field_template_fields").delete().eq("template_id", id);
      if (deleteError) { res.status(500).json({ error: "Velden bijwerken mislukt." }); return; }
      if (body.fields.length > 0) {
        const rows = body.fields.map((f, i) => ({
          template_id: id, field_key: f.field_key, label: f.label, data_type: f.data_type,
          required: Boolean(f.required), options: f.options ?? null, validation: f.validation ?? null,
          sort_order: f.sort_order ?? i, visible: f.visible !== undefined ? Boolean(f.visible) : true,
        }));
        const { error: insertError } = await supabase.from("custom_field_template_fields").insert(rows);
        if (insertError) { res.status(500).json({ error: "Velden opslaan mislukt." }); return; }
      }
    }
    const { data } = await supabase.from("custom_field_templates").select("*").eq("id", id).maybeSingle();
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const { error, count } = await supabase.from("custom_field_templates").delete({ count: "exact" }).eq("id", id);
    if (error) { res.status(500).json({ error: "Verwijderen mislukt." }); return; }
    if (!count) { res.status(404).json({ error: "Template niet gevonden." }); return; }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ---------------------------------------------------------------------
// customers / appointments / services / ai_settings — alleen-lezen,
// cross-organisatie, uitsluitend voor admin
// ---------------------------------------------------------------------
async function handleReadOnlyOrgData(req, res, supabase, auth, table) {
  if (!requireAdmin(auth, res)) return;
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }
  const { organization_id } = req.query || {};
  if (!organization_id) { res.status(400).json({ error: "organization_id is verplicht." }); return; }
  const single = table === "ai_settings";
  const query = supabase.from(table).select("*").eq("organization_id", organization_id);
  const { data, error } = single ? await query.maybeSingle() : await query;
  if (error) { res.status(500).json({ error: `Kon ${table} niet ophalen.` }); return; }
  res.status(200).json(data || (single ? null : []));
}

// ---------------------------------------------------------------------
// invoices — volledige CRUD, admin-only (garages mogen alleen lezen via
// hun eigen, bestaande organization.js?resource=invoices — ongewijzigd)
// ---------------------------------------------------------------------
async function handleInvoices(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;

  if (req.method === "GET") {
    const { organization_id } = req.query || {};
    let query = supabase.from("invoices").select("*").order("issue_date", { ascending: false });
    if (organization_id) query = query.eq("organization_id", organization_id);
    const { data, error } = await query;
    if (error) { res.status(500).json({ error: "Kon facturen niet ophalen." }); return; }
    res.status(200).json(data || []);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.organization_id || !body.invoice_number || body.total === undefined) {
      res.status(400).json({ error: "organization_id, invoice_number en total zijn verplicht." });
      return;
    }
    const { data, error } = await supabase.from("invoices").insert({
      organization_id: body.organization_id, invoice_number: body.invoice_number, description: body.description || null,
      subtotal: body.subtotal ?? null, tax: body.tax ?? null, total: body.total, currency: body.currency || "EUR",
      status: body.status || "openstaand", due_date: body.due_date || null, pdf_url: body.pdf_url || null,
    }).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Aanmaken mislukt." }); return; }
    res.status(201).json(data);
    return;
  }

  if (req.method === "PUT") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const body = req.body || {};
    const updates = {};
    for (const key of ["invoice_number", "description", "subtotal", "tax", "total", "currency", "status", "due_date", "pdf_url"]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.status === "betaald" && !body.paid_at) updates.paid_at = new Date().toISOString();
    const { data, error } = await supabase.from("invoices").update(updates).eq("id", id).select().maybeSingle();
    if (error) { res.status(500).json({ error: "Bijwerken mislukt." }); return; }
    if (!data) { res.status(404).json({ error: "Factuur niet gevonden." }); return; }
    res.status(200).json(data);
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ error: "Ontbrekend id." }); return; }
    const { error, count } = await supabase.from("invoices").delete({ count: "exact" }).eq("id", id);
    if (error) { res.status(500).json({ error: "Verwijderen mislukt." }); return; }
    if (!count) { res.status(404).json({ error: "Factuur niet gevonden." }); return; }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ---------------------------------------------------------------------
// overview — dashboard-KPI's
// ---------------------------------------------------------------------
async function handleOverview(req, res, supabase, auth) {
  if (!requireAdmin(auth, res)) return;
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const [{ count: orgCount }, { count: userCount }, { data: statusRows }, { data: industryRows }] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("memberships").select("user_id", { count: "exact", head: true }),
    supabase.from("organizations").select("status"),
    supabase.from("organizations").select("industry_id, industries(name)"),
  ]);

  const byStatus = {};
  for (const row of statusRows || []) byStatus[row.status] = (byStatus[row.status] || 0) + 1;

  const byIndustry = {};
  for (const row of industryRows || []) {
    const label = row.industries?.name || "Onbekend";
    byIndustry[label] = (byIndustry[label] || 0) + 1;
  }

  res.status(200).json({
    total_organizations: orgCount || 0,
    total_users: userCount || 0,
    by_status: byStatus,
    by_industry: byIndustry,
  });
}

// ---------------------------------------------------------------------
export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const supabase = await getServiceClient();
  const { resource } = req.query || {};

  switch (resource) {
    case "organizations": return handleOrganizations(req, res, supabase, auth);
    case "users": return handleUsers(req, res, supabase, auth);
    case "subscriptions": return handleSubscriptions(req, res, supabase, auth);
    case "industries": return handleIndustries(req, res, supabase, auth);
    case "custom-field-templates": return handleTemplates(req, res, supabase, auth);
    case "customers": return handleReadOnlyOrgData(req, res, supabase, auth, "customers");
    case "appointments": return handleReadOnlyOrgData(req, res, supabase, auth, "appointments");
    case "services": return handleReadOnlyOrgData(req, res, supabase, auth, "services");
    case "ai_settings": return handleReadOnlyOrgData(req, res, supabase, auth, "ai_settings");
    case "invoices": return handleInvoices(req, res, supabase, auth);
    case "overview": return handleOverview(req, res, supabase, auth);
    default:
      res.status(404).json({ error: "Onbekende resource." });
  }
}
