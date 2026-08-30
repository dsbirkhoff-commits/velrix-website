import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Archive, RotateCcw } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import AdminDynamicFields from "../../components/AdminDynamicFields.jsx";

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    adminApi.getOrgCustomer(id)
      .then((c) => {
        setCustomer(c);
        setForm({ naam: c.naam || "", voornaam: c.voornaam || "", achternaam: c.achternaam || "", email: c.email || "", telefoonnummer: c.telefoonnummer || "", notities: c.notities || "", custom_fields: c.custom_fields || {} });
        return adminApi.getOrganization(c.organization_id);
      })
      .then((org) => setSchema(org.custom_fields_schema || []))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await adminApi.updateOrgCustomer(id, form);
      setCustomer(updated);
      setToast({ type: "success", msg: "Klant bijgewerkt" });
    } catch (err) {
      setSaveError(err.message || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async () => {
    const nextStatus = customer.status === "actief" ? "inactief" : "actief";
    setArchiving(true);
    try {
      const updated = await adminApi.updateOrgCustomer(id, { status: nextStatus });
      setCustomer(updated);
      setToast({ type: "success", msg: nextStatus === "inactief" ? "Klant gearchiveerd" : "Klant weer actief" });
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Wijzigen van status mislukt." });
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  if (loadError) return <div className="dp-empty">{loadError}</div>;
  if (!customer || !form) return null;

  return (
    <div>
      <DashboardPageStyles />
      <button className="dp-btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate(`/admin/customers?organization_id=${customer.organization_id}`)}>
        <ArrowLeft size={14} /> Terug naar klanten
      </button>

      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="dp-title">{customer.naam}</h1>
          <p className="dp-sub">
            <span className={`dp-badge ${customer.status === "actief" ? "dp-badge-green" : "dp-badge-gray"}`}>{customer.status}</span>
            <Link to={`/admin/organizations/${customer.organization_id}`} style={{ marginLeft: 10, color: "var(--gold-bright)", fontSize: 13 }}>Naar organisatie →</Link>
          </p>
        </div>
        <button className="dp-btn-ghost" disabled={archiving} onClick={toggleArchive}>
          {archiving ? <Loader2 size={14} className="animate-spin" /> : customer.status === "actief" ? <><Archive size={14} /> Archiveren</> : <><RotateCcw size={14} /> Heractiveren</>}
        </button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-card">
        <form onSubmit={save}>
          <div className="dp-grid dp-cols-3">
            <div className="dp-field"><label className="dp-label">Voornaam</label><input className="dp-input" value={form.voornaam} onChange={(e) => setForm((f) => ({ ...f, voornaam: e.target.value }))} disabled={saving} /></div>
            <div className="dp-field"><label className="dp-label">Achternaam</label><input className="dp-input" value={form.achternaam} onChange={(e) => setForm((f) => ({ ...f, achternaam: e.target.value }))} disabled={saving} /></div>
            <div className="dp-field"><label className="dp-label">Volledige naam</label><input className="dp-input" value={form.naam} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))} disabled={saving} /></div>
            <div className="dp-field"><label className="dp-label">E-mail</label><input type="email" className="dp-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={saving} /></div>
            <div className="dp-field"><label className="dp-label">Telefoon</label><input className="dp-input" value={form.telefoonnummer} onChange={(e) => setForm((f) => ({ ...f, telefoonnummer: e.target.value }))} disabled={saving} /></div>
          </div>

          {schema.length > 0 && (
            <>
              <div className="dp-section-title" style={{ marginTop: 8 }}>Custom fields</div>
              <div className="dp-grid dp-cols-3">
                <AdminDynamicFields
                  schema={schema}
                  values={form.custom_fields}
                  onChange={(key, val) => setForm((f) => ({ ...f, custom_fields: { ...f.custom_fields, [key]: val } }))}
                  disabled={saving}
                />
              </div>
            </>
          )}

          <div className="dp-field"><label className="dp-label">Notities</label><textarea className="dp-input" rows={3} value={form.notities} onChange={(e) => setForm((f) => ({ ...f, notities: e.target.value }))} disabled={saving} /></div>

          {saveError && <div className="dp-toast dp-toast-error" style={{ marginBottom: 12 }}>{saveError}</div>}
          <button type="submit" className="dp-btn" disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : "Opslaan"}</button>
        </form>
      </div>
    </div>
  );
}
