/**
 * POST /api/integrations-leads — server-to-server lead/klant-aanmaak voor
 * externe integraties (n8n e.a.). Volledig los van de Portal-/admin-
 * authenticatie: geen gebruikers-JWT, uitsluitend een statische API-key.
 *
 * Authenticatie: header X-VELRIX-API-Key (nooit een query-parameter —
 * voorkomt dat de key in logs/URL's/browsergeschiedenis belandt).
 * De ruwe key wordt NERGENS opgeslagen — uitsluitend een SHA-256-hash
 * in api_keys.key_hash. Bij een inkomend verzoek wordt de meegestuurde
 * key gehasht en vergeleken, nooit andersom.
 *
 * organization_id komt UITSLUITEND uit de server-side api_keys-lookup
 * (organization_id van de rij die bij de key_hash hoort) — exact
 * hetzelfde principe als _orgAuth.js voor de Portal-endpoints, alleen
 * met een API-key-hash i.p.v. een gebruikers-JWT als bron. Een eventueel
 * in de request-body meegestuurd "organization_id"-veld wordt hieronder
 * NERGENS gelezen.
 *
 * Rate limiting (v1, bewust minimaal, geen nieuwe tabel/kolommen buiten
 * wat al is goedgekeurd): een simpele minimuminterval tussen
 * opeenvolgende verzoeken per key, gebaseerd op de bestaande
 * last_used_at-kolom. Geen sliding-window-teller — dat zou een aparte
 * tabel/kolommen vereisen, bewust niet toegevoegd zonder apart akkoord.
 */
import { getServiceClient } from "./_supabase.js";
import { insertCustomer } from "./_customerInsert.js";
import crypto from "node:crypto";

const MIN_INTERVAL_MS = 1000; // max. 1 verzoek per seconde per key

function hashKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawKey = req.headers["x-velrix-api-key"];
  if (!rawKey || typeof rawKey !== "string") {
    res.status(401).json({ error: "Ontbrekende API-key." });
    return;
  }

  const supabase = await getServiceClient();
  const keyHash = hashKey(rawKey);

  const { data: apiKey, error: keyError } = await supabase
    .from("api_keys")
    .select("id, organization_id, revoked_at, last_used_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  // Bewust dezelfde 401-respons voor "bestaat niet" én "ingetrokken" —
  // geen onderscheid, zodat een aanvaller niet kan afleiden of een
  // geraden key ooit heeft bestaan.
  if (keyError || !apiKey || apiKey.revoked_at) {
    // Geen ruwe key, geen key-ID van een niet-gevonden poging loggen —
    // uitsluitend dat er een mislukte poging was.
    console.warn("integrations-leads: ongeldige of ingetrokken API-key-poging");
    res.status(401).json({ error: "Ongeldige of ingetrokken API-key." });
    return;
  }

  // Rate limiting — vóór de daadwerkelijke insert, na de key-lookup (zodat
  // dit per key geldt, niet globaal).
  if (apiKey.last_used_at) {
    const elapsed = Date.now() - new Date(apiKey.last_used_at).getTime();
    if (elapsed < MIN_INTERVAL_MS) {
      res.status(429).json({ error: "Te veel verzoeken. Probeer het over een moment opnieuw." });
      return;
    }
  }

  const body = req.body || {};
  // organization_id wordt hier bewust NOOIT uit body gelezen — uitsluitend
  // apiKey.organization_id (server-side, uit de api_keys-tabel) wordt
  // gebruikt, ongeacht wat de aanroeper meestuurt.
  const { status, body: responseBody } = await insertCustomer(supabase, apiKey.organization_id, body);

  // last_used_at bijwerken — best-effort, een fout hierin mag de
  // eigenlijke aanmaak-respons niet blokkeren.
  try {
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);
  } catch (err) {
    console.error("integrations-leads: kon last_used_at niet bijwerken:", err.message);
  }

  // Logging: key-ID (nooit de ruwe key), organisatie, status, en het
  // resulterende klant-ID — nooit de volledige request-body (kan e-mail/
  // telefoon bevatten) of de volledige response.
  console.log(`integrations-leads: key=${apiKey.id} org=${apiKey.organization_id} status=${status} customer_id=${responseBody?.id || "n.v.t."}`);

  res.status(status).json(responseBody);
}
