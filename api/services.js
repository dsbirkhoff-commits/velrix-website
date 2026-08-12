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

  res.status(405).json({ error: "Method not allowed" });
}
