import React, { useEffect, useState } from "react";
import { Loader2, Plus, Tags } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const EMPTY = { name: "", slug: "", description: "" };

export default function AdminBranches() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.listIndustries().then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await adminApi.createIndustry(form);
      setRows((r) => [...r, created]);
      setForm(EMPTY);
      setShowForm(false);
      showToast("success", "Opgeslagen");
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const toggleActive = async (row) => {
    setBusyId(row.id);
    try {
      const updated = await adminApi.updateIndustry(row.id, { active: !row.active });
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)));
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="dp-title">Branches</h1>
          <p className="dp-sub">De beschikbare industries voor nieuwe organisaties.</p>
        </div>
        <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe branche</button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={submit} className="dp-grid dp-cols-3" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Naam</label><input className="dp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Slug</label><input className="dp-input" placeholder="bijv. beauty" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required /></div>
            <button type="submit" className="dp-btn">Toevoegen</button>
          </form>
        </div>
      )}

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><Tags size={20} /></div>Nog geen branches.</div>
          : (
            <table className="dp-table">
              <thead><tr><th>Naam</th><th>Slug</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td style={{ color: "var(--text-dim)" }}>{row.slug}</td>
                    <td>
                      <span className={`dp-badge ${row.active ? "dp-badge-green" : "dp-badge-gray"}`} style={{ cursor: "pointer" }} onClick={() => toggleActive(row)}>
                        {busyId === row.id ? <Loader2 size={10} className="animate-spin" /> : row.active ? "actief" : "inactief"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
