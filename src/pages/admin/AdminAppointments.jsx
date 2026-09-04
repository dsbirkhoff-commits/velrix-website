import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CalendarClock, Pencil, X, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const STATUS_OPTIONS = [
  { value: "bevestigd", label: "bevestigd" },
  { value: "geannuleerd", label: "geannuleerd" },
  { value: "voltooid", label: "voltooid" },
];
const STATUS_BADGE = { bevestigd: "dp-badge-green", geannuleerd: "dp-badge-red", voltooid: "dp-badge-gray" };
const EMPTY_EDIT = { datum: "", tijd: "", klantnaam: "", email: "", telefoonnummer: "", type: "", status: "bevestigd" };

export default function AdminAppointments() {
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(searchParams.get("organization_id") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");

  // Inline bewerken: losse state per geopende rij.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => { adminApi.listOrganizations().then(setOrganizations).catch(() => {}); }, []);

  const load = () => {
    if (!orgId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    adminApi.listOrgAppointments(orgId).then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [orgId]);
  useEffect(() => { setQuery(""); setStatusFilter(""); setEditingId(null); }, [orgId]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = rows;
    if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);
    if (q) filtered = filtered.filter((a) =>
      (a.klantnaam || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q)
    );
    filtered = [...filtered];
    if (sortBy === "newest") filtered.sort((a, b) => new Date(b.datum) - new Date(a.datum) || (b.tijd || "").localeCompare(a.tijd || ""));
    else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.datum) - new Date(b.datum) || (a.tijd || "").localeCompare(b.tijd || ""));
    else if (sortBy === "name") filtered.sort((a, b) => (a.klantnaam || "").localeCompare(b.klantnaam || ""));
    return filtered;
  }, [rows, query, sortBy, statusFilter]);

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditForm({
      datum: a.datum || "", tijd: a.tijd || "", klantnaam: a.klantnaam || "",
      email: a.email || "", telefoonnummer: a.telefoonnummer || "", type: a.type || "", status: a.status,
    });
    setEditError(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    // Geen API-call — bestaande gegevens blijven exact zoals ze waren.
  };
  const saveEdit = async (a) => {
    // Extra bevestiging specifiek bij het annuleren van een afspraak —
    // bewuste, destructief-aanvoelende actie, ook al blijft de rij bestaan.
    if (editForm.status === "geannuleerd" && a.status !== "geannuleerd") {
      if (!window.confirm(`Weet je zeker dat je de afspraak van ${a.klantnaam} op ${a.datum} wilt annuleren?`)) return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      await adminApi.updateOrgAppointment(a.id, editForm);
      setEditingId(null);
      load(); // server blijft de bron van waarheid
      showToast("success", "Afspraak bijgewerkt");
    } catch (err) {
      setEditError(err.message || "Opslaan mislukt.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Afspraken</h1>
        <p className="dp-sub">VELRIX → organisatie. Kies eerst een organisatie.</p>
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

      {orgId && (
        <div className="dp-card" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <label className="dp-label">Zoeken</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input className="dp-input" style={{ paddingLeft: 34 }} placeholder="Klantnaam of e-mail..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="dp-label">Status</label>
            <DarkSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="Alle statussen"
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="dp-label">Sorteren</label>
            <DarkSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Nieuwste eerst" },
                { value: "oldest", label: "Oudste eerst" },
                { value: "name", label: "Klantnaam (A-Z)" },
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
                <div className="dp-empty-icon"><CalendarClock size={20} /></div>
                {query || statusFilter ? "Geen afspraken gevonden voor dit filter." : "Deze organisatie heeft nog geen afspraken."}
              </div>
            ) : (
              <table className="dp-table">
                <thead><tr><th>Datum</th><th>Tijd</th><th>Klant</th><th>Type</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {visibleRows.map((a) => (
                    <React.Fragment key={a.id}>
                      <tr>
                        <td>{a.datum}</td>
                        <td>{a.tijd}</td>
                        <td>{a.klantnaam}</td>
                        <td>{a.type || "—"}</td>
                        <td><span className={`dp-badge ${STATUS_BADGE[a.status] || "dp-badge-gray"}`}>{a.status}</span></td>
                        <td>
                          {editingId === a.id ? (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={cancelEdit}><X size={13} /> Annuleren</button>
                          ) : (
                            <button className="dp-btn-ghost" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => startEdit(a)}><Pencil size={13} /> Bewerken</button>
                          )}
                        </td>
                      </tr>
                      {editingId === a.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                            <div className="dp-grid dp-cols-4" style={{ alignItems: "end" }}>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Datum</label>
                                <input type="date" className="dp-input" value={editForm.datum} onChange={(e) => setEditForm((f) => ({ ...f, datum: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Tijd</label>
                                <input className="dp-input" placeholder="HH:MM" value={editForm.tijd} onChange={(e) => setEditForm((f) => ({ ...f, tijd: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Klantnaam</label>
                                <input className="dp-input" value={editForm.klantnaam} onChange={(e) => setEditForm((f) => ({ ...f, klantnaam: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Type</label>
                                <input className="dp-input" value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">E-mail</label>
                                <input type="email" className="dp-input" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} disabled={savingEdit} />
                              </div>
                              <div className="dp-field" style={{ marginBottom: 0 }}>
                                <label className="dp-label">Telefoon</label>
                                <input className="dp-input" value={editForm.telefoonnummer} onChange={(e) => setEditForm((f) => ({ ...f, telefoonnummer: e.target.value }))} disabled={savingEdit} />
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
                              <button className="dp-btn" disabled={savingEdit} onClick={() => saveEdit(a)}>
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
