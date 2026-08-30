import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CreditCard, Plus, Pencil, X, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const STATUS_OPTIONS = [
  { value: "actief", label: "actief" },
  { value: "gepauzeerd", label: "gepauzeerd" },
  { value: "opgezegd", label: "opgezegd" },
];
const STATUS_BADGE = { actief: "dp-badge-green", opgezegd: "dp-badge-red", gepauzeerd: "dp-badge-gold" };
const EMPTY_NEW = { organization_id: "", plan_name: "", notes: "" };

export default function AdminSubscriptions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");

  // Inline bewerken: losse state per geopende rij, kan het
  // aanmaakformulier nooit beïnvloeden.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ plan_name: "", status: "actief", notes: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [newSub, setNewSub] = useState(EMPTY_NEW);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.listSubscriptions(), adminApi.listOrganizations()])
      .then(([subs, orgs]) => { setRows(subs); setOrganizations(orgs); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const orgName = (id) => organizations.find((o) => o.id === id)?.name || "— onbekende organisatie —";

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => orgName(s.organization_id).toLowerCase().includes(q));
  }, [rows, query, organizations]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ plan_name: row.plan_name, status: row.status, notes: row.notes || "" });
    setEditError(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    // Geen API-call — bestaande gegevens blijven exact zoals ze waren.
  };
  const saveEdit = async (id) => {
    setSavingEdit(true);
    setEditError(null);
    try {
      // Uitsluitend plan_name/status/notes — organization_id wordt hier
      // nooit meegestuurd, en de backend negeert dat veld sowieso.
      await adminApi.updateSubscription(id, { plan_name: editForm.plan_name, status: editForm.status, notes: editForm.notes });
      setEditingId(null);
      load(); // server blijft de bron van waarheid
      showToast("success", "Abonnement bijgewerkt");
    } catch (err) {
      setEditError(err.message || "Opslaan mislukt.");
    } finally {
      setSavingEdit(false);
    }
  };

  const createSub = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.createSubscription(newSub);
      setShowForm(false);
      setNewSub(EMPTY_NEW);
      load();
      showToast("success", "Abonnement aangemaakt");
    } catch (err) {
      setCreateError(err.message || "Aanmaken mislukt.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="dp-title">Abonnementen</h1>
          <p className="dp-sub">Alle actieve, gepauzeerde en opgezegde abonnementen.</p>
        </div>
        <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuw abonnement</button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={createSub} className="dp-grid dp-cols-3" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Organisatie</label>
              <DarkSelect
                value={newSub.organization_id}
                onChange={(val) => setNewSub((f) => ({ ...f, organization_id: val }))}
                options={organizations.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="— Kies een organisatie —"
                searchable
                searchPlaceholder="Zoek organisatie..."
              />
            </div>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Pakket</label>
              <input className="dp-input" value={newSub.plan_name} onChange={(e) => setNewSub((f) => ({ ...f, plan_name: e.target.value }))} required />
            </div>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Notities (optioneel)</label>
              <input className="dp-input" value={newSub.notes} onChange={(e) => setNewSub((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            {createError && <div className="dp-toast dp-toast-error" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>{createError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="dp-btn" disabled={creating || !newSub.organization_id}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Aanmaken"}
              </button>
              <button type="button" className="dp-btn-ghost" disabled={creating} onClick={() => setShowForm(false)}>Annuleren</button>
            </div>
          </form>
        </div>
      )}

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <label className="dp-label">Zoeken op organisatie</label>
        <div style={{ position: "relative", maxWidth: 340 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input className="dp-input" style={{ paddingLeft: 34 }} placeholder="Organisatienaam..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : visibleRows.length === 0 ? (
            <div className="dp-empty">
              <div className="dp-empty-icon"><CreditCard size={20} /></div>
              {query ? "Geen abonnementen gevonden voor deze organisatie." : "Nog geen abonnementen."}
            </div>
          ) : (
            <table className="dp-table">
              <thead><tr><th>Organisatie</th><th>Pakket</th><th>Status</th><th>Gestart</th><th></th></tr></thead>
              <tbody>
                {visibleRows.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td>{orgName(s.organization_id)}</td>
                      <td>{s.plan_name}</td>
                      <td><span className={`dp-badge ${STATUS_BADGE[s.status] || "dp-badge-gray"}`}>{s.status}</span></td>
                      <td>{s.started_at}</td>
                      <td>
                        {editingId === s.id ? (
                          <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={cancelEdit}><X size={13} /> Annuleren</button>
                        ) : (
                          <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => startEdit(s)}><Pencil size={13} /> Bewerken</button>
                        )}
                      </td>
                    </tr>
                    {editingId === s.id && (
                      <tr>
                        <td colSpan={5} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                          <div className="dp-grid dp-cols-3" style={{ alignItems: "end" }}>
                            <div className="dp-field" style={{ marginBottom: 0 }}>
                              <label className="dp-label">Pakket</label>
                              <input className="dp-input" value={editForm.plan_name} onChange={(e) => setEditForm((f) => ({ ...f, plan_name: e.target.value }))} disabled={savingEdit} />
                            </div>
                            <div className="dp-field" style={{ marginBottom: 0 }}>
                              <label className="dp-label">Status</label>
                              <DarkSelect
                                value={editForm.status}
                                onChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
                                options={STATUS_OPTIONS}
                                hideEmptyOption
                                disabled={savingEdit}
                              />
                            </div>
                            <div className="dp-field" style={{ marginBottom: 0 }}>
                              <label className="dp-label">Notities</label>
                              <input className="dp-input" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} disabled={savingEdit} />
                            </div>
                          </div>
                          {editError && <div className="dp-toast dp-toast-error" style={{ marginTop: 12, marginBottom: 0 }}>{editError}</div>}
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="dp-btn" disabled={savingEdit} onClick={() => saveEdit(s.id)}>
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
