import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Play, Pause, Users, ListTree, CreditCard } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const STATUS_BADGE = { concept: "dp-badge-gold", actief: "dp-badge-green", gepauzeerd: "dp-badge-red" };

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getOrganization(id).then(setOrg).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const doAction = async (action) => {
    setBusy(true);
    try {
      if (action === "activate") await adminApi.activateOrganization(id);
      else await adminApi.pauseOrganization(id);
      setToast({ type: "success", msg: "Status bijgewerkt" });
      load();
    } catch (err) {
      setToast({ type: "error", msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  if (error) return <div className="dp-empty">{error}</div>;
  if (!org) return null;

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="dp-title">{org.name}</h1>
          <p className="dp-sub">
            <span className={`dp-badge ${STATUS_BADGE[org.status]}`}>{org.status}</span>
            {org.industries?.name && <span style={{ marginLeft: 10 }}>{org.industries.name}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {org.status !== "actief" && (
            <button className="dp-btn" disabled={busy} onClick={() => doAction("activate")}><Play size={14} /> Activeren</button>
          )}
          {org.status === "actief" && (
            <button className="dp-btn-ghost" disabled={busy} onClick={() => doAction("pause")}><Pause size={14} /> Pauzeren</button>
          )}
        </div>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-grid dp-cols-3">
        <div className="dp-card">
          <div className="dp-section-title"><Users size={15} /> Gebruikers</div>
          {org.memberships.length === 0 ? <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Nog geen gebruiker gekoppeld.</p> : (
            org.memberships.map((m) => <div key={m.user_id} style={{ fontSize: 13, padding: "6px 0" }}>{m.user_id} — {m.role}</div>)
          )}
        </div>
        <div className="dp-card">
          <div className="dp-section-title"><CreditCard size={15} /> Abonnement</div>
          {org.subscription ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{org.subscription.plan_name}</div>
              <span className="dp-badge dp-badge-gray" style={{ marginTop: 6 }}>{org.subscription.status}</span>
            </>
          ) : <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Geen abonnement.</p>}
        </div>
        <div className="dp-card">
          <div className="dp-section-title"><ListTree size={15} /> Custom-field schema</div>
          {org.custom_fields_schema.length === 0 ? <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Geen custom fields.</p> : (
            org.custom_fields_schema.map((f) => <div key={f.id} style={{ fontSize: 13, padding: "4px 0" }}>{f.label} <span style={{ color: "var(--text-dim)" }}>({f.data_type})</span></div>)
          )}
        </div>
      </div>

      <div className="dp-card" style={{ marginTop: 16 }}>
        <div className="dp-section-title">Snelkoppelingen</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to={`/admin/customers?organization_id=${id}`} style={{ color: "var(--gold-bright)", fontSize: 13 }}>Klanten bekijken →</Link>
          <Link to={`/admin/appointments?organization_id=${id}`} style={{ color: "var(--gold-bright)", fontSize: 13 }}>Afspraken bekijken →</Link>
          <Link to={`/admin/services?organization_id=${id}`} style={{ color: "var(--gold-bright)", fontSize: 13 }}>Diensten bekijken →</Link>
          <Link to={`/admin/invoices?organization_id=${id}`} style={{ color: "var(--gold-bright)", fontSize: 13 }}>Facturen beheren →</Link>
        </div>
      </div>
    </div>
  );
}
