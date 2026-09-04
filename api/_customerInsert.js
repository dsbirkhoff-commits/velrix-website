/**
 * Gedeelde klant-aanmaaklogica — letterlijk geëxtraheerd uit de
 * bestaande, bewezen POST-tak van api/customers.js (geen enkele
 * gedragswijziging, puur een refactor). Gebruikt door:
 *   - api/customers.js zelf (Portal, gebruikerstoken-auth)
 *   - api/integrations-leads.js (n8n, API-key-auth)
 * Retourneert altijd { status, body } — de aanroeper stuurt dit exact
 * zo naar res.status(...).json(...), zodat beide endpoints identieke
 * statuscodes/foutmeldingen geven voor dezelfde situaties.
 */
import { getSchemaForOrg, validateCustomFields } from "./_customFields.js";

export async function insertCustomer(supabase, organizationId, body) {
  const voornaam = (body.voornaam || "").trim();
  const achternaam = (body.achternaam || "").trim();
  if (!voornaam && !achternaam) {
    return { status: 400, body: { error: "Voornaam of achternaam is verplicht." } };
  }

  let cleanedCustomFields = {};
  if (body.custom_fields && Object.keys(body.custom_fields).length > 0) {
    let schema;
    try {
      schema = await getSchemaForOrg(supabase, organizationId);
    } catch {
      return { status: 500, body: { error: "Kon schema niet controleren." } };
    }
    const result = validateCustomFields(body.custom_fields, schema);
    if (!result.valid) {
      return { status: 400, body: { error: result.errors.join(" ") } };
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
    console.error("insertCustomer error:", error);
    return { status: 500, body: { error: "Aanmaken mislukt." } };
  }
  return { status: 201, body: data };
}
