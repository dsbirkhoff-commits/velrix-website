import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

export default async function handler(req, res) {
  const auth = await resolveOrgFromRequest(req);
  const organizationId = requireOrg(auth, res);
  if (!organizationId) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabase = await getServiceClient();
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
