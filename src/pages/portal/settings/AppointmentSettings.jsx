import React, { useEffect, useState } from "react";
import { CalendarClock, Loader2, Save } from "lucide-react";
import { portalApi } from "../../../lib/portalApi.js";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

const DAY_OPTIONS = [
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
  { value: 0, label: "Zondag" },
];

export default function AppointmentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    beschikbare_dagen: [1, 2, 3, 4, 5],
    openingstijden: {},
    standaard_afspraakduur_minuten: 30,
    buffer_minuten: 15,
    max_afspraken_per_tijdsblok: 1,
  });

  useEffect(() => {
    let cancelled = false;
    portalApi
      .getAppointmentSettings()
      .then((data) => {
        if (cancelled) return;
        setForm({
          beschikbare_dagen: data.beschikbare_dagen || [1, 2, 3, 4, 5],
          openingstijden: data.openingstijden || {},
          standaard_afspraakduur_minuten: data.standaard_afspraakduur_minuten || 30,
          buffer_minuten: data.buffer_minuten ?? 15,
          max_afspraken_per_tijdsblok: data.max_afspraken_per_tijdsblok || 1,
        });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const toggleDay = (value) => {
    setForm((f) => ({
      ...f,
      beschikbare_dagen: f.beschikbare_dagen.includes(value) ? f.beschikbare_dagen.filter((d) => d !== value) : [...f.beschikbare_dagen, value],
    }));
  };

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      await portalApi.updateAppointmentSettings(form);
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
        <h1 className="dp-title">Afspraakinstellingen</h1>
        <p className="dp-sub">Bepaalt straks hoe de publieke boekingsflow beschikbaarheid berekent.</p>
      </div>

      <div className="dp-notice" style={{ fontSize: 12, color: "var(--text-dim)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, background: "rgba(201,166,104,.05)" }}>
        Deze instellingen worden nu opgeslagen, maar de bestaande boekingsflow gebruikt ze nog niet automatisch — dat is een aparte, latere koppeling.
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><CalendarClock size={15} /> Beschikbare dagen</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DAY_OPTIONS.map((d) => (
              <span
                key={d.value}
                className={`dp-badge ${form.beschikbare_dagen.includes(d.value) ? "dp-badge-green" : "dp-badge-gray"}`}
                style={{ cursor: "pointer" }}
                onClick={() => toggleDay(d.value)}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>

        <div className="dp-card">
          <div className="dp-section-title">Tijdvakken</div>
          <div className="dp-field">
            <label className="dp-label">Standaard afspraakduur (minuten)</label>
            <input type="number" className="dp-input" value={form.standaard_afspraakduur_minuten} onChange={(e) => setForm((f) => ({ ...f, standaard_afspraakduur_minuten: Number(e.target.value) }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Buffer tussen afspraken (minuten)</label>
            <input type="number" className="dp-input" value={form.buffer_minuten} onChange={(e) => setForm((f) => ({ ...f, buffer_minuten: Number(e.target.value) }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Maximale afspraken per tijdsblok</label>
            <input type="number" min={1} className="dp-input" value={form.max_afspraken_per_tijdsblok} onChange={(e) => setForm((f) => ({ ...f, max_afspraken_per_tijdsblok: Number(e.target.value) }))} />
          </div>
        </div>
      </div>

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <div className="dp-section-title">Openingstijden voor boekingen</div>
        {DAY_OPTIONS.map((d) => (
          <div key={d.value} className="dp-field" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ width: 90, fontSize: 12.5, color: "var(--text-muted)" }}>{d.label}</span>
            <input
              className="dp-input"
              placeholder="bijv. 09:00–17:00"
              value={form.openingstijden[d.label] || ""}
              onChange={(e) => setForm((f) => ({ ...f, openingstijden: { ...f.openingstijden, [d.label]: e.target.value } }))}
            />
          </div>
        ))}
      </div>

      <button className="dp-btn" onClick={save} disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Opslaan…" : "Opslaan"}
      </button>
    </div>
  );
}
