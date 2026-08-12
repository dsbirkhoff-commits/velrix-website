import { getServiceClient } from "./_supabase.js";
import { resolveOrgFromRequest, requireOrg } from "./_orgAuth.js";

// Alleen GET — het aanmaken van facturen is bewust een VELRIX-interne
// (admin-only) handeling, geen garage-zelfbedieningsfunctie. Zie de RLS
// policies in supabase/migrations/0004_fase2_fixes.sql: garages mogen
// hun eigen facturen uitsluitend lezen, nooit zelf aanmaken/wijzigen.
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
    .from("invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .order("issue_date", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Kon facturen niet ophalen." });
    return;
  }
  res.status(200).json(data || []);
}
