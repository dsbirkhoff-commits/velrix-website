/**
 * Server-side only. Shared logic for validating customer custom_fields
 * against an organization's own custom_field_definitions schema — used
 * by both api/customers.js (which also handles PUT/DELETE via a query
 * parameter, see that file) so the validation
 * rule is defined exactly once, not duplicated (and potentially
 * forgotten) per endpoint.
 *
 * THE ACTUAL SECURITY GUARANTEE for "geen ongewenste velden kunnen
 * injecteren": any key in the incoming custom_fields object that is NOT
 * a field_key present in this organization's own schema causes the
 * ENTIRE request to be rejected (not silently dropped) — see
 * validateCustomFields() below. RLS cannot enforce this (it works on
 * rows, not on keys inside a JSONB blob), so this check must run on
 * every write path, without exception.
 */

export async function getSchemaForOrg(supabase, organizationId, entityType = "customer") {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * @param {object} inputFields - the custom_fields object from the request body
 * @param {Array} schema - this organization's custom_field_definitions rows
 * @returns {{ valid: boolean, errors: string[], cleaned: object }}
 */
export function validateCustomFields(inputFields, schema) {
  const errors = [];
  const cleaned = {};
  const schemaByKey = Object.fromEntries(schema.map((f) => [f.field_key, f]));

  for (const [key, value] of Object.entries(inputFields || {})) {
    const def = schemaByKey[key];
    if (!def) {
      // Onbekend veld -> direct weigeren, exact zoals het technisch
      // ontwerp voorschrijft. Niet stilzwijgend negeren.
      errors.push(`Onbekend veld: "${key}" bestaat niet in het schema van deze organisatie.`);
      continue;
    }
    if (def.visible === false) {
      errors.push(`Veld "${def.label}" is niet actief.`);
      continue;
    }

    let v = value;
    if (def.data_type === "number") {
      v = Number(value);
      if (Number.isNaN(v)) {
        errors.push(`${def.label} moet een getal zijn.`);
        continue;
      }
      if (def.validation?.min !== undefined && v < def.validation.min) {
        errors.push(`${def.label} moet minimaal ${def.validation.min} zijn.`);
        continue;
      }
      if (def.validation?.max !== undefined && v > def.validation.max) {
        errors.push(`${def.label} mag maximaal ${def.validation.max} zijn.`);
        continue;
      }
    } else if (def.data_type === "boolean") {
      v = Boolean(value);
    } else if (def.data_type === "select") {
      const allowed = (def.options || []).map((o) => o.value);
      if (!allowed.includes(value)) {
        errors.push(`Ongeldige waarde voor ${def.label}.`);
        continue;
      }
    } else if (def.data_type === "multiselect") {
      const allowed = (def.options || []).map((o) => o.value);
      if (!Array.isArray(value) || !value.every((x) => allowed.includes(x))) {
        errors.push(`Ongeldige waarde voor ${def.label}.`);
        continue;
      }
    } else {
      // text of date
      v = String(value);
      if (def.validation?.pattern) {
        let re;
        try {
          re = new RegExp(def.validation.pattern);
        } catch {
          re = null;
        }
        if (re && !re.test(v)) {
          errors.push(`${def.label} heeft een ongeldig formaat.`);
          continue;
        }
      }
      if (def.validation?.maxLength && v.length > def.validation.maxLength) {
        errors.push(`${def.label} is te lang.`);
        continue;
      }
    }

    cleaned[key] = v;
  }

  for (const def of schema) {
    if (def.required && (cleaned[def.field_key] === undefined || cleaned[def.field_key] === null || cleaned[def.field_key] === "")) {
      errors.push(`${def.label} is verplicht.`);
    }
  }

  return { valid: errors.length === 0, errors, cleaned };
}
