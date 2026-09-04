import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Plus, Wrench, Pencil, X, Trash2, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const EMPTY = { naam: "", beschrijving: "", prijs: "", afspraakduur_minuten: "30" };
const EMPTY_EDIT = { naam: "", beschrijving: "", prijs: "", afspraakduur_minuten: "", actief: true };

export default function AdminServices() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(searchParams.get("organization_id") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [activeFilter, setActiveFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Inline bewerken: losse state per geopende rij.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => { adminApi.listOrganizations().then(setOrganizations).catch(() => {}); }, []);

  const load = () => {
    if (!orgId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    adminApi.listOrgServices(orgId).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [orgId]);
  useEffect(() => { setQuery(""); setActiveFilter(""); setShowForm(false); setEditingId(null); }, [orgId]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = rows;
    if (activeFilter === "actief") filtered = filtered.filter((s) => s.actief);
    else if (activeFilter === "inactief") filtered = filtered.filter((s) => !s.actief);
    if (q) filtered = filtered.filter((s) =>
      (s.naam || "").toLowerCase().includes(q) || (s.beschrijving || "").toLowerCase().includes(q)
    );
    filtered = [...filtered];
    if (sortBy === "name") filtered.sort((a, b) => (a.naam || "").localeCompare(b.naam || ""));
    else if (sortBy === "price_desc") filtered.sort((a, b) => (Number(b.prijs) || 0) - (Number(a.prijs) || 0));
    else if (sortBy === "price_asc") filtered.sort((a, b) => (Number(a.prijs) || 0) - (Number(b.prijs) || 0));
    else if (sortBy === "duration") filtered.sort((a, b) => (a.afspraakduur_minuten || 0) - (b.afspraakduur_minuten || 0));
    return filtered;
  }, [rows, query, sortBy, activeFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.createService({
        organization_id: orgId, naam: form.naam, beschrijving: form.beschrijving || null,
        prijs: form.prijs === "" ? null : Number(form.prijs),
        afspraakduur_minuten: form.afspraakduur_minuten === "" ? 30 : Number(form.afspraakduur_minuten),
      });
      showToast("success", "Dienst aangemaakt");
      setForm(EMPTY); setShowForm(false);
      load();
    } catch (err) {
      setCreateError(err.message || "Aanmaken mislukt.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      naam: s.naam, beschrijving: s.beschrijving || "",
      prijs: s.prijs ?? "", afspraakduur_minuten: s.afspraakduur_minuten ?? "", actief: s.actief,
    });
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
      await adminApi.updateService(id, {
        naam: editForm.naam, beschrijving: editForm.beschrijving,
        prijs: editForm.prijs === "" ? null : Number(editForm.prijs),
        afspraakduur_minuten: Number(editForm.afspraakduur_minuten),
        actief: editForm.actief,
      });
      setEditingId(null);
      load(); // server blijft de bron van waarheid
      showToast("success", "Dienst bijgewerkt");
    } catch (err) {
      setEditError(err.message || "Opslaan mislukt.");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeService = async (s) => {
    if (!window.confirm(`Weet je zeker dat je '${s.naam}' wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setRemoving(s.id);
    try {
      await adminApi.deleteService(s.id);
      load();
      showToast("success", "Dienst verwijderd");
    } catch (err) {
      showToast("error", err.message || "Verwijderen mislukt.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="dp-title">Diensten</h1>
          <p className="dp-sub">VELRIX → organisatie. Kies eerst een organisatie.</p>
        </div>
        {orgId && <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe dienst</button>}
      </div>

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <label className="dp-label">Organisatie</label>
        <DarkSelect
          value={orgId}
          onChange={setOrgId}
          options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          placeholder="— Kies een organisatie —"
          searchable
          searchPlaceholder="Zoek organisatie..."
        />
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && orgId && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={submit} className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Naam</label><input className="dp-input" value={form.naam} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))} required /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Beschrijving</label><input className="dp-input" value={form.beschrijving} onChange={(e) => setForm((f) => ({ ...f, beschrijving: e.target.value }))} /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Prijs (€)</label><input type="number" step="0.01" className="dp-input" value={form.prijs} onChange={(e) => setForm((f) => ({ ...f, prijs: e.target.value }))} /></div>
            <div className="dp-field" style={{ marginBottom: 0 }}><label className="dp-label">Duur (min)</label><input type="number" step="1" min="1" className="dp-input" value={form.afspraakduur_minuten} onChange={(e) => setForm((f) => ({ ...f, afspraakduur_minuten: e.target.value }))} /></div>
            {createError && <div className="dp-toast dp-toast-error" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>{createError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="dp-btn" disabled={creating}>{creating ? <Loader2 size={14} className="animate-spin" /> : "Aanmaken"}</button>
              <button type="button" className="dp-btn-ghost" disabled={creating} onClick={() => setShowForm(false)}>Annuleren</button>
            </div>
          </form>
        </div>
      )}

      {orgId && (
        <div className="dp-card" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <label className="dp-label">Zoeken</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input className="dp-input" style={{ paddingLeft: 34 }} placeholder="Naam of beschrijving..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="dp-label">Status</label>
            <DarkSelect
              value={activeFilter}
              onChange={setActiveFilter}
              options={[{ value: "actief", label: "actief" }, { value: "inactief", label: "inactief" }]}
              placeholder="Alle"
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="dp-label">Sorteren</label>
            <DarkSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "name", label: "Naam (A-Z)" },
                { value: "price_desc", label: "Prijs (hoog-laag)" },
                { value: "price_asc", label: "Prijs (laag-hoog)" },
                { value: "duration", label: "Duur" },
              ]}
              hideEmptyOption
            />
          </div>
        </div>
      )}

      {!orgId ? null : (
        <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
            : error ? <div className="dp-empty">{error}</div>
            : visibleRows.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon"><Wrench size={20} /></div>
                {query || activeFilter ? "Geen diensten gevonden voor dit filter." : "Deze organisatie heeft nog geen diensten."}
              </div>
            ) : (
              <table className="dp-table">
                <thead><tr><th>Naam</th><th>Beschrijving</th><th>Prijs</th><th>Duur (min)</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {visibleRows.map((s) => (
                    <React.Fragment key={s.id}>
                      <tr>
                        <td>{s.naam}</td>
                        <td>{s.beschrijving || "—"}</td>
                        <td>{s.prijs != null ? `€${Number(s.prijs).toFixed(2)}` : "—"}</td>
                        <td>{s.afspraakduur_minuten}</td>
                        <td><span className={`dp-badge ${s.actief ? "dp-badge-green" : "dp-badge-gray"}`}>{s.actief ? "actief" : "inactief"}</span></td>
                        <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {editingId === s.id ? (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={cancelEdit}><X size={13} /> Annuleren</button>
                          ) : (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => startEdit(s)}><Pencil size={13} /> Bewerken</button>
                          )}
                          <button
                            className="dp-btn-ghost"
                            style={{ padding: "5px 9px", fontSize: 12 }}
                            disabled={removing === s.id}
                            onClick={() => removeService(s)}
                          >
                            {removing === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </td>
                      </tr>
                      {editingId === s.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                            <div className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Naam</label>
                                <input className="dp-input" value={editForm.naam} onChange={(e) => setEditForm((f) => ({ ...f, naam: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Beschrijving</label>
                                <input className="dp-input" value={editForm.beschrijving} onChange={(e) => setEditForm((f) => ({ ...f, beschrijving: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Prijs (€)</label>
                                <input type="number" step="0.01" className="dp-input" value={editForm.prijs} onChange={(e) => setEditForm((f) => ({ ...f, prijs: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Duur (min)</label>
                                <input type="number" step="1" min="1" className="dp-input" value={editForm.afspraakduur_minuten} onChange={(e) => setEditForm((f) => ({ ...f, afspraakduur_minuten: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" checked={editForm.actief} disabled={savingEdit} onChange={(e) => setEditForm((f) => ({ ...f, actief: e.target.checked }))} />
                                <label className="dp-label" style={{ marginBottom: 0 }}>Actief</label>
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
      )}
    </div>
  );
}
