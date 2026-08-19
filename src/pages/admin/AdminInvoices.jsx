import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Plus, Receipt } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const EMPTY = { invoice_number: "", description: "", total: "", due_date: "", status: "openstaand" };

export default function AdminInvoices() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(searchParams.get("organization_id") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { adminApi.listOrganizations().then(setOrganizations).catch(() => {}); }, []);

  const load = () => {
    if (!orgId) { setRows([]); return; }
    setLoading(true);
    adminApi.listInvoices(orgId).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [orgId]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createInvoice({ ...form, organization_id: orgId, total: Number(form.total) });
      showToast("success", "Factuur aangemaakt");
      setForm(EMPTY); setShowForm(false);
      load();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const markPaid = async (id) => {
    try {
      await adminApi.updateInvoice(id, { status: "betaald" });
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
          <h1 className="dp-title">Facturen</h1>
          <p className="dp-sub">VELRIX → organisatie. Kies eerst een organisatie.</p>
        </div>
        {orgId && <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe factuur</button>}
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

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && orgId && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={submit} className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Factuurnummer</label><input className="dp-input" value={form.invoice_number} onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))} required /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Omschrijving</label><input className="dp-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Bedrag (€)</label><input type="number" step="0.01" className="dp-input" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))} required /></div>
            <button type="submit" className="dp-btn">Aanmaken</button>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Vervaldatum</label><input type="date" className="dp-input" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
          </form>
        </div>
      )}

      {!orgId ? null : (
        <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
            : error ? <div className="dp-empty">{error}</div>
            : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><Receipt size={20} /></div>Nog geen facturen voor deze organisatie.</div>
            : (
              <table className="dp-table">
                <thead><tr><th>Nummer</th><th>Omschrijving</th><th>Bedrag</th><th>Vervaldatum</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {rows.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.invoice_number}</td>
                      <td>{inv.description || "—"}</td>
                      <td>€{Number(inv.total).toFixed(2)}</td>
                      <td>{inv.due_date || "—"}</td>
                      <td><span className={`dp-badge ${inv.status === "betaald" ? "dp-badge-green" : inv.status === "verlopen" ? "dp-badge-red" : "dp-badge-gold"}`}>{inv.status}</span></td>
                      <td>{inv.status !== "betaald" && <button className="dp-btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => markPaid(inv.id)}>Markeer betaald</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  );
}
