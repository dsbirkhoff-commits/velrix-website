import React, { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

export default function AdminSubscriptions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listSubscriptions().then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Abonnementen</h1>
        <p className="dp-sub">Alle actieve, gepauzeerde en opgezegde abonnementen.</p>
      </div>
      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><CreditCard size={20} /></div>Nog geen abonnementen.</div>
          : (
            <table className="dp-table">
              <thead><tr><th>Pakket</th><th>Status</th><th>Gestart</th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.plan_name}</td>
                    <td><span className={`dp-badge ${s.status === "actief" ? "dp-badge-green" : s.status === "opgezegd" ? "dp-badge-red" : "dp-badge-gold"}`}>{s.status}</span></td>
                    <td>{s.started_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
