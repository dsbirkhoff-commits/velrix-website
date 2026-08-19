import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

export default function AdminAiReceptionists() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(searchParams.get("organization_id") || "");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { adminApi.listOrganizations().then(setOrganizations).catch(() => {}); }, []);
  useEffect(() => {
    if (!orgId) { setSettings(null); return; }
    setLoading(true); setError(null);
    adminApi.getOrgAiSettings(orgId).then(setSettings).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header"><h1 className="dp-title">AI Receptionists</h1><p className="dp-sub">Cross-organisatie leesoverzicht — kies eerst een organisatie.</p></div>
      <div className="dp-card" style={{ marginBottom: 16 }}>
        <label className="dp-label">Organisatie</label>
        <DarkSelect
          value={orgId}
          onChange={setOrgId}
          options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          placeholder="— Kies een organisatie —"
        />
      </div>
      {!orgId ? null : (
        <div className="dp-card">
          {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
            : error ? <div className="dp-empty">{error}</div>
            : !settings ? <div className="dp-empty">Nog geen AI-instellingen voor deze organisatie.</div>
            : (
              <>
                <div style={{ marginBottom: 10 }}><span className={`dp-badge ${settings.ai_actief ? "dp-badge-green" : "dp-badge-gray"}`}>{settings.ai_actief ? "Actief" : "Inactief"}</span></div>
                <p style={{ fontSize: 13.5 }}><strong>Begroeting:</strong> {settings.begroeting || "—"}</p>
                <p style={{ fontSize: 13.5 }}><strong>Bedrijfsomschrijving:</strong> {settings.bedrijfsomschrijving || "—"}</p>
                <p style={{ fontSize: 13.5 }}><strong>FAQ:</strong> {(settings.faq || []).length} vraag/antwoord-paren</p>
              </>
            )}
        </div>
      )}
    </div>
  );
}
