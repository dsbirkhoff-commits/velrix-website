import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

/**
 * Generic, admin-only, cross-organization read-only viewer. Requires
 * picking an organization first (via ?organization_id= or a dropdown) —
 * there is deliberately no "show everyone's data at once" mode.
 */
export default function AdminOrgDataViewer({ title, sub, emptyText, fetchFn, columns }) {
  const [searchParams] = useSearchParams();
  const orgIdFromUrl = searchParams.get("organization_id") || "";
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(orgIdFromUrl);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listOrganizations().then(setOrganizations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!orgId) { setRows(null); return; }
    setLoading(true);
    setError(null);
    fetchFn(orgId)
      .then((data) => setRows(Array.isArray(data) ? data : data ? [data] : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">{title}</h1>
        <p className="dp-sub">{sub}</p>
      </div>

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
        <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
            : error ? <div className="dp-empty">{error}</div>
            : !rows || rows.length === 0 ? <div className="dp-empty">{emptyText}</div>
            : (
              <table className="dp-table">
                <thead><tr>{columns.map((c) => (<th key={c.key}>{c.label}</th>))}</tr></thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id || i}>{columns.map((c) => (<td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? "—"}</td>))}</tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  );
}
