import React, { useEffect, useState } from "react";
import { Wrench, Loader2, Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { portalApi } from "../../lib/portalApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const EMPTY_FORM = { naam: "", beschrijving: "", prijs: "", afspraakduur_minuten: 30, actief: true };

export default function Services() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    portalApi
      .listServices()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!newForm.naam.trim()) return;
    setAdding(true);
    try {
      const created = await portalApi.createService(newForm);
      setRows((r) => [...r, created]);
      setNewForm(EMPTY_FORM);
      showToast("success", "Opgeslagen");
    } catch (err) {
      showToast("error", err.message || "Toevoegen mislukt.");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ naam: row.naam, beschrijving: row.beschrijving || "", prijs: row.prijs ?? "", afspraakduur_minuten: row.afspraakduur_minuten, actief: row.actief });
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const updated = await portalApi.updateService(id, editForm);
      setRows((r) => r.map((row) => (row.id === id ? updated : row)));
      setEditingId(null);
      showToast("success", "Opgeslagen");
    } catch (err) {
      showToast("error", err.message || "Bijwerken mislukt.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (row) => {
    setBusyId(row.id);
    try {
      const updated = await portalApi.updateService(row.id, { actief: !row.actief });
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)));
    } catch (err) {
      showToast("error", err.message || "Bijwerken mislukt.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Deze dienst verwijderen?")) return;
    setBusyId(id);
    try {
      await portalApi.deleteService(id);
      setRows((r) => r.filter((row) => row.id !== id));
      showToast("success", "Verwijderd");
    } catch (err) {
      showToast("error", err.message || "Verwijderen mislukt.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Mijn diensten</h1>
        <p className="dp-sub">De diensten die jouw garage aanbiedt, met prijs en afspraakduur.</p>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <div className="dp-section-title"><Plus size={15} /> Nieuwe dienst</div>
        <form onSubmit={submitNew} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="dp-field" style={{ marginBottom: 0 }}>
            <label className="dp-label">Naam</label>
            <input className="dp-input" placeholder="bijv. APK" value={newForm.naam} onChange={(e) => setNewForm((f) => ({ ...f, naam: e.target.value }))} required />
          </div>
          <div className="dp-field" style={{ marginBottom: 0 }}>
            <label className="dp-label">Prijs (€)</label>
            <input type="number" step="0.01" className="dp-input" placeholder="49" value={newForm.prijs} onChange={(e) => setNewForm((f) => ({ ...f, prijs: e.target.value }))} />
          </div>
          <div className="dp-field" style={{ marginBottom: 0 }}>
            <label className="dp-label">Duur (min)</label>
            <input type="number" className="dp-input" value={newForm.afspraakduur_minuten} onChange={(e) => setNewForm((f) => ({ ...f, afspraakduur_minuten: e.target.value }))} />
          </div>
          <button type="submit" className="dp-btn" disabled={adding}>
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Toevoegen
          </button>
        </form>
        <div className="dp-field" style={{ marginTop: 10, marginBottom: 0 }}>
          <label className="dp-label">Beschrijving (optioneel)</label>
          <input className="dp-input" value={newForm.beschrijving} onChange={(e) => setNewForm((f) => ({ ...f, beschrijving: e.target.value }))} />
        </div>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : error ? (
          <div className="dp-empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Wrench size={20} /></div>
            Nog geen diensten toegevoegd. Voeg hierboven je eerste dienst toe.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Naam</th><th>Beschrijving</th><th>Prijs</th><th>Duur</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {editingId === row.id ? (
                    <>
                      <td><input className="dp-input" value={editForm.naam} onChange={(e) => setEditForm((f) => ({ ...f, naam: e.target.value }))} /></td>
                      <td><input className="dp-input" value={editForm.beschrijving} onChange={(e) => setEditForm((f) => ({ ...f, beschrijving: e.target.value }))} /></td>
                      <td><input type="number" step="0.01" className="dp-input" style={{ width: 90 }} value={editForm.prijs} onChange={(e) => setEditForm((f) => ({ ...f, prijs: e.target.value }))} /></td>
                      <td><input type="number" className="dp-input" style={{ width: 80 }} value={editForm.afspraakduur_minuten} onChange={(e) => setEditForm((f) => ({ ...f, afspraakduur_minuten: e.target.value }))} /></td>
                      <td>
                        <span className={`dp-badge ${editForm.actief ? "dp-badge-green" : "dp-badge-gray"}`} style={{ cursor: "pointer" }} onClick={() => setEditForm((f) => ({ ...f, actief: !f.actief }))}>
                          {editForm.actief ? "actief" : "inactief"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="dp-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => saveEdit(row.id)} disabled={busyId === row.id}>
                          {busyId === row.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        </button>
                        <button className="dp-btn-ghost" style={{ padding: "6px 10px", marginLeft: 6 }} onClick={() => setEditingId(null)}><X size={13} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{row.naam}</td>
                      <td>{row.beschrijving || "—"}</td>
                      <td>{row.prijs != null ? `€${Number(row.prijs).toFixed(2)}` : "—"}</td>
                      <td>{row.afspraakduur_minuten} min</td>
                      <td>
                        <span className={`dp-badge ${row.actief ? "dp-badge-green" : "dp-badge-gray"}`} style={{ cursor: "pointer" }} onClick={() => toggleActive(row)}>
                          {busyId === row.id ? <Loader2 size={10} className="animate-spin" /> : row.actief ? "actief" : "inactief"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="dp-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => startEdit(row)}><Pencil size={13} /></button>
                        <button className="dp-btn-ghost" style={{ padding: "6px 10px", marginLeft: 6, color: "var(--red)" }} onClick={() => remove(row.id)} disabled={busyId === row.id}><Trash2 size={13} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
