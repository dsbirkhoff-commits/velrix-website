import React, { useEffect, useState } from "react";
import { Loader2, Building2, Users, PieChart } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getOverview().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  if (error) return <div className="dp-empty">{error}</div>;

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Dashboard</h1>
        <p className="dp-sub">Overzicht van alle VELRIX-organisaties.</p>
      </div>

      <div className="dp-grid dp-cols-3" style={{ marginBottom: 20 }}>
        <div className="dp-card">
          <div className="dp-kpi-label"><Building2 size={14} /> Organisaties</div>
          <div className="dp-kpi-value">{data.total_organizations}</div>
        </div>
        <div className="dp-card">
          <div className="dp-kpi-label"><Users size={14} /> Gekoppelde gebruikers</div>
          <div className="dp-kpi-value">{data.total_users}</div>
        </div>
        <div className="dp-card">
          <div className="dp-kpi-label"><PieChart size={14} /> Branches in gebruik</div>
          <div className="dp-kpi-value">{Object.keys(data.by_industry || {}).length}</div>
        </div>
      </div>

      <div className="dp-grid dp-cols-2">
        <div className="dp-card">
          <div className="dp-section-title">Per status</div>
          {Object.entries(data.by_status || {}).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Nog geen organisaties.</div>
          ) : (
            Object.entries(data.by_status).map(([status, count]) => (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 13.5 }}>
                <span style={{ textTransform: "capitalize" }}>{status}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>
        <div className="dp-card">
          <div className="dp-section-title">Per branche</div>
          {Object.entries(data.by_industry || {}).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Nog geen organisaties.</div>
          ) : (
            Object.entries(data.by_industry).map(([name, count]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 13.5 }}>
                <span>{name}</span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
