import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  const supabase = await getServiceClient();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
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
      console.error("POST /api/customers error:", error);
      res.status(500).json({ error: "Aanmaken mislukt." });
      return;
    }
    res.status(201).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
