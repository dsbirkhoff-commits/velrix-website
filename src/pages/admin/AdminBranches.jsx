import React, { useEffect, useState } from "react";
import { Loader2, Plus, Tags, Pencil, X } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const EMPTY = { name: "", slug: "", description: "", template_id: "" };

export default function AdminBranches() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Bewerken: welke rij staat open, en zijn eigen, losse formulierstate —
  // zodat het aanmaakformulier en een openstaand edit-formulier elkaar
  // nooit kunnen beïnvloeden.
  const [editingId, setEditingId] = useState(null);
  const [editTemplateId, setEditTemplateId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.listIndustries(), adminApi.listTemplates()])
      .then(([industries, tpl]) => { setRows(industries); setTemplates(tpl); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const templateOptions = templates.map((t) => ({ value: t.id, label: t.name }));
  const templateName = (id) => templates.find((t) => t.id === id)?.name || null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await adminApi.createIndustry({ ...form, template_id: form.template_id || null });
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

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditTemplateId(row.template_id || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTemplateId("");
  };

  const saveEdit = async (row) => {
    setSavingEdit(true);
    try {
      const updated = await adminApi.updateIndustry(row.id, { template_id: editTemplateId || null });
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)));
      setEditingId(null);
      setEditTemplateId("");
      showToast("success", "Standaardtemplate opgeslagen");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSavingEdit(false);
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
          <form onSubmit={submit} className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Naam</label><input className="dp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Slug</label><input className="dp-input" placeholder="bijv. beauty" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Standaardtemplate</label>
              <DarkSelect
                value={form.template_id}
                onChange={(val) => setForm((f) => ({ ...f, template_id: val }))}
                options={templateOptions}
                placeholder="— Geen —"
                searchable
                searchPlaceholder="Zoek standaardtemplate..."
              />
            </div>
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
              <thead><tr><th>Naam</th><th>Slug</th><th>Standaardtemplate</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr>
                      <td>{row.name}</td>
                      <td style={{ color: "var(--text-dim)" }}>{row.slug}</td>
                      <td>{templateName(row.template_id) || <span style={{ color: "var(--text-dim)" }}>— Geen —</span>}</td>
                      <td>
                        <span className={`dp-badge ${row.active ? "dp-badge-green" : "dp-badge-gray"}`} style={{ cursor: "pointer" }} onClick={() => toggleActive(row)}>
                          {busyId === row.id ? <Loader2 size={10} className="animate-spin" /> : row.active ? "actief" : "inactief"}
                        </span>
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={cancelEdit}><X size={13} /> Annuleren</button>
                        ) : (
                          <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => startEdit(row)}><Pencil size={13} /> Bewerken</button>
                        )}
                      </td>
                    </tr>
                    {editingId === row.id && (
                      <tr>
                        <td colSpan={5} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
                            <div style={{ minWidth: 260 }}>
                              <label className="dp-label">Standaardtemplate voor {row.name}</label>
                              <DarkSelect
                                value={editTemplateId}
                                onChange={setEditTemplateId}
                                options={templateOptions}
                                placeholder="— Geen —"
                                searchable
                                searchPlaceholder="Zoek standaardtemplate..."
                              />
                            </div>
                            <button className="dp-btn" disabled={savingEdit} onClick={() => saveEdit(row)}>
                              {savingEdit ? <Loader2 size={13} className="animate-spin" /> : "Opslaan"}
                            </button>
                            <button className="dp-btn-ghost" disabled={savingEdit} onClick={cancelEdit}>Annuleren</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
