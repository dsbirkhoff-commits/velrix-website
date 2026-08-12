import React, { useEffect, useState } from "react";
import { Building2, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { portalApi } from "../../../lib/portalApi.js";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

const DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const TIMEZONES = ["Europe/Amsterdam", "Europe/Brussels", "Europe/London", "UTC"];

export default function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    bedrijfsnaam: "",
    logo_url: "",
    adres: "",
    postcode: "",
    plaats: "",
    email: "",
    openingstijden: {},
    tijdzone: "Europe/Amsterdam",
  });

  useEffect(() => {
    let cancelled = false;
    portalApi
      .getOrganization()
      .then((data) => {
        if (cancelled) return;
        setForm({
          bedrijfsnaam: data.bedrijfsnaam || "",
          logo_url: data.logo_url || "",
          adres: data.adres || "",
          postcode: data.postcode || "",
          plaats: data.plaats || "",
          email: data.email || "",
          openingstijden: data.openingstijden || {},
          tijdzone: data.tijdzone || "Europe/Amsterdam",
        });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      await portalApi.updateOrganization(form);
      setToast({ type: "success", msg: "Opgeslagen" });
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Opslaan mislukt." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  if (error) return <div className="dp-empty">{error}</div>;

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Bedrijfsprofiel</h1>
        <p className="dp-sub">Deze gegevens vormen de basis van je VELRIX-systeem.</p>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><Building2 size={15} /> Bedrijfsgegevens</div>
          <div className="dp-field">
            <label className="dp-label">Bedrijfsnaam</label>
            <input className="dp-input" value={form.bedrijfsnaam} onChange={(e) => setForm((f) => ({ ...f, bedrijfsnaam: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">E-mailadres</label>
            <input type="email" className="dp-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Adres</label>
            <input className="dp-input" value={form.adres} onChange={(e) => setForm((f) => ({ ...f, adres: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="dp-field" style={{ flex: 1 }}>
              <label className="dp-label">Postcode</label>
              <input className="dp-input" value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} />
            </div>
            <div className="dp-field" style={{ flex: 2 }}>
              <label className="dp-label">Plaats</label>
              <input className="dp-input" value={form.plaats} onChange={(e) => setForm((f) => ({ ...f, plaats: e.target.value }))} />
            </div>
          </div>
          <div className="dp-field">
            <label className="dp-label">Tijdzone</label>
            <select className="dp-select" value={form.tijdzone} onChange={(e) => setForm((f) => ({ ...f, tijdzone: e.target.value }))}>
              {TIMEZONES.map((tz) => (<option key={tz} value={tz}>{tz}</option>))}
            </select>
          </div>
          <div className="dp-field">
            <label className="dp-label"><ImageIcon size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Logo-URL</label>
            <input className="dp-input" placeholder="https://..." value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
          </div>
        </div>

        <div className="dp-card">
          <div className="dp-section-title">Openingstijden</div>
          {DAYS.map((day) => (
            <div key={day} className="dp-field" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 90, fontSize: 12.5, color: "var(--text-muted)" }}>{day}</span>
              <input
                className="dp-input"
                placeholder="bijv. 08:00–17:30 of Gesloten"
                value={form.openingstijden[day] || ""}
                onChange={(e) => setForm((f) => ({ ...f, openingstijden: { ...f.openingstijden, [day]: e.target.value } }))}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="dp-btn" onClick={save} disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Opslaan…" : "Opslaan"}
      </button>
    </div>
  );
}
