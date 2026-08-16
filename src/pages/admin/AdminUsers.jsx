import React, { useEffect, useState } from "react";
import { Loader2, UserCog } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listUsers().then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Gebruikers</h1>
        <p className="dp-sub">Alle gekoppelde gebruikers, per organisatie.</p>
      </div>
      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><UserCog size={20} /></div>Nog geen gebruikers gekoppeld.</div>
          : (
            <table className="dp-table">
              <thead><tr><th>Gebruiker</th><th>Organisatie</th><th>Rol</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.user_id}-${r.organization_id}`}>
                    <td>{r.user_id}</td>
                    <td>{r.organizations?.name || r.organization_id}</td>
                    <td><span className="dp-badge dp-badge-gray">{r.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
