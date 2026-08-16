import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Building2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const STATUS_BADGE = { concept: "dp-badge-gold", actief: "dp-badge-green", gepauzeerd: "dp-badge-red" };

export default function AdminOrganizations() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listOrganizations().then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="dp-title">Organisaties</h1>
          <p className="dp-sub">Alle VELRIX-klantorganisaties.</p>
        </div>
        <Link to="/admin/organizations/new" className="dp-btn" style={{ textDecoration: "none" }}><Plus size={15} /> Nieuwe organisatie</Link>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
        ) : error ? (
          <div className="dp-empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Building2 size={20} /></div>
            Nog geen organisaties. Maak de eerste aan.
          </div>
        ) : (
          <table className="dp-table">
            <thead><tr><th>Naam</th><th>Branche</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((org) => (
                <tr key={org.id}>
                  <td>{org.name}</td>
                  <td>{org.industries?.name || "—"}</td>
                  <td><span className={`dp-badge ${STATUS_BADGE[org.status] || "dp-badge-gray"}`}>{org.status}</span></td>
                  <td><Link to={`/admin/organizations/${org.id}`} style={{ color: "var(--gold-bright)", fontSize: 13 }}>Bekijken →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
