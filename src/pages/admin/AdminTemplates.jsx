import React, { useEffect, useState } from "react";
import { Loader2, Plus, ListTree, X, Trash2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const EMPTY_FIELD = { field_key: "", label: "", data_type: "text", required: false };

export default function AdminTemplates() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState(EMPTY_FIELD);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.listTemplates(), adminApi.listIndustries()])
      .then(([t, i]) => { setRows(t); setIndustries(i); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const addField = () => {
    if (!newField.field_key.trim() || !newField.label.trim()) return;
    setFields((f) => [...f, { ...newField, sort_order: f.length }]);
    setNewField(EMPTY_FIELD);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createTemplate({ name, industry_id: industryId || null, fields });
      showToast("success", "Opgeslagen");
      setName(""); setIndustryId(""); setFields([]); setShowForm(false);
      load();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="dp-title">Custom Field Templates</h1>
          <p className="dp-sub">Startpunten voor nieuwe organisaties — worden gekopieerd, nooit live gekoppeld.</p>
        </div>
        <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe template</button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={submit}>
            <div className="dp-grid dp-cols-2">
              <div className="dp-field"><label className="dp-label">Templatenaam</label><input className="dp-input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="dp-field">
                <label className="dp-label">Branche</label>
                <select className="dp-select" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                  <option value="">— Geen —</option>
                  {industries.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                </select>
              </div>
            </div>

            <div className="dp-section-title" style={{ marginTop: 8 }}>Velden</div>
            {fields.map((f, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13 }}>
                <span style={{ flex: 1 }}>{f.label} <span style={{ color: "var(--text-dim)" }}>({f.field_key}, {f.data_type}{f.required ? ", verplicht" : ""})</span></span>
                <X size={14} style={{ cursor: "pointer", color: "var(--text-dim)" }} onClick={() => setFields((fs) => fs.filter((_, i) => i !== idx))} />
              </div>
            ))}
            <div className="dp-grid dp-cols-4" style={{ marginTop: 8, marginBottom: 4 }}>
              <input className="dp-input" placeholder="field_key" value={newField.field_key} onChange={(e) => setNewField((f) => ({ ...f, field_key: e.target.value }))} />
              <input className="dp-input" placeholder="Label" value={newField.label} onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))} />
              <select className="dp-select" value={newField.data_type} onChange={(e) => setNewField((f) => ({ ...f, data_type: e.target.value }))}>
                <option value="text">text</option><option value="number">number</option><option value="boolean">boolean</option>
                <option value="date">date</option><option value="select">select</option><option value="multiselect">multiselect</option>
              </select>
              <button type="button" className="dp-btn-ghost" onClick={addField}><Plus size={13} /> Veld</button>
            </div>

            <button type="submit" className="dp-btn" style={{ marginTop: 12 }}>Template opslaan</button>
          </form>
        </div>
      )}

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><ListTree size={20} /></div>Nog geen templates.</div>
          : (
            <table className="dp-table">
              <thead><tr><th>Naam</th><th>Branche</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.industries?.name || "—"}</td>
                    <td><span className={`dp-badge ${row.active ? "dp-badge-green" : "dp-badge-gray"}`}>{row.active ? "actief" : "inactief"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
