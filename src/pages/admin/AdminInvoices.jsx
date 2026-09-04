import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Plus, Receipt, Pencil, X, Trash2, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const STATUS_OPTIONS = [
  { value: "openstaand", label: "openstaand" },
  { value: "betaald", label: "betaald" },
  { value: "verlopen", label: "verlopen" },
];
const STATUS_BADGE = { betaald: "dp-badge-green", verlopen: "dp-badge-red", openstaand: "dp-badge-gold" };
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

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Inline bewerken: losse state per geopende rij.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => { adminApi.listOrganizations().then(setOrganizations).catch(() => {}); }, []);

  const load = () => {
    if (!orgId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    adminApi.listInvoices(orgId).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [orgId]);
  useEffect(() => { setQuery(""); setEditingId(null); setShowForm(false); }, [orgId]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = !q ? rows : rows.filter((inv) =>
      (inv.invoice_number || "").toLowerCase().includes(q) || (inv.description || "").toLowerCase().includes(q)
    );
    filtered = [...filtered];
    if (sortBy === "newest") filtered.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));
    else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.issue_date) - new Date(b.issue_date));
    else if (sortBy === "total_desc") filtered.sort((a, b) => Number(b.total) - Number(a.total));
    else if (sortBy === "total_asc") filtered.sort((a, b) => Number(a.total) - Number(b.total));
    return filtered;
  }, [rows, query, sortBy]);

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

  const startEdit = (inv) => {
    setEditingId(inv.id);
    setEditForm({
      invoice_number: inv.invoice_number, description: inv.description || "",
      total: inv.total, due_date: inv.due_date || "", status: inv.status,
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
      await adminApi.updateInvoice(id, { ...editForm, total: Number(editForm.total) });
      setEditingId(null);
      load(); // server blijft de bron van waarheid
      showToast("success", "Factuur bijgewerkt");
    } catch (err) {
      setEditError(err.message || "Opslaan mislukt.");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeInvoice = async (inv) => {
    if (!window.confirm(`Weet je zeker dat je factuur ${inv.invoice_number} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setRemoving(inv.id);
    try {
      await adminApi.deleteInvoice(inv.id);
      load();
      showToast("success", "Factuur verwijderd");
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
          searchable
          searchPlaceholder="Zoek organisatie..."
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

      {orgId && (
        <div className="dp-card" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <label className="dp-label">Zoeken</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input className="dp-input" style={{ paddingLeft: 34 }} placeholder="Factuurnummer of omschrijving..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ minWidth: 200 }}>
            <label className="dp-label">Sorteren</label>
            <DarkSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Nieuwste eerst" },
                { value: "oldest", label: "Oudste eerst" },
                { value: "total_desc", label: "Bedrag (hoog-laag)" },
                { value: "total_asc", label: "Bedrag (laag-hoog)" },
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
                <div className="dp-empty-icon"><Receipt size={20} /></div>
                {query ? "Geen facturen gevonden voor deze zoekopdracht." : "Nog geen facturen voor deze organisatie."}
              </div>
            ) : (
              <table className="dp-table">
                <thead><tr><th>Nummer</th><th>Omschrijving</th><th>Bedrag</th><th>Vervaldatum</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {visibleRows.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <tr>
                        <td>{inv.invoice_number}</td>
                        <td>{inv.description || "—"}</td>
                        <td>€{Number(inv.total).toFixed(2)}</td>
                        <td>{inv.due_date || "—"}</td>
                        <td><span className={`dp-badge ${STATUS_BADGE[inv.status] || "dp-badge-gray"}`}>{inv.status}</span></td>
                        <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {editingId === inv.id ? (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={cancelEdit}><X size={13} /> Annuleren</button>
                          ) : (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => startEdit(inv)}><Pencil size={13} /> Bewerken</button>
                          )}
                          <button
                            className="dp-btn-ghost"
                            style={{ padding: "5px 9px", fontSize: 12 }}
                            disabled={removing === inv.id}
                            onClick={() => removeInvoice(inv)}
                          >
                            {removing === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </td>
                      </tr>
                      {editingId === inv.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                            <div className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Factuurnummer</label>
                                <input className="dp-input" value={editForm.invoice_number} onChange={(e) => setEditForm((f) => ({ ...f, invoice_number: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Omschrijving</label>
                                <input className="dp-input" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Bedrag (€)</label>
                                <input type="number" step="0.01" className="dp-input" value={editForm.total} onChange={(e) => setEditForm((f) => ({ ...f, total: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Vervaldatum</label>
                                <input type="date" className="dp-input" value={editForm.due_date} onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))} disabled={savingEdit} />
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
                            </div>
                            {editError && <div className="dp-toast dp-toast-error" style={{ marginTop: 12, marginBottom: 0 }}>{editError}</div>}
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                              <button className="dp-btn" disabled={savingEdit} onClick={() => saveEdit(inv.id)}>
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
