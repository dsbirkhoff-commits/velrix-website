import React, { useEffect, useState } from "react";
import { Loader2, UserCog, Plus, Trash2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

const ROLE_OPTIONS = [
  { value: "owner", label: "owner" },
  { value: "member", label: "member" },
];
const EMPTY_NEW = { organization_id: "", email: "", role: "member" };

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [savingRole, setSavingRole] = useState(null); // `${user_id}-${organization_id}` van de rij die bezig is
  const [removing, setRemoving] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_NEW);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.listUsers(), adminApi.listOrganizations()])
      .then(([users, orgs]) => { setRows(users); setOrganizations(orgs); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const changeRole = async (row, newRole) => {
    const key = `${row.user_id}-${row.organization_id}`;
    setSavingRole(key);
    try {
      await adminApi.updateUser(row.user_id, { organization_id: row.organization_id, role: newRole });
      load(); // server blijft de bron van waarheid
      showToast("success", "Rol bijgewerkt");
    } catch (err) {
      showToast("error", err.message || "Rol wijzigen mislukt.");
    } finally {
      setSavingRole(null);
    }
  };

  const removeMember = async (row) => {
    const label = row.email || row.user_id;
    if (!window.confirm(`Weet je zeker dat je ${label} wilt verwijderen uit ${row.organizations?.name || "deze organisatie"}? Dit kan niet ongedaan worden gemaakt.`)) return;
    const key = `${row.user_id}-${row.organization_id}`;
    setRemoving(key);
    try {
      await adminApi.removeUserFromOrganization(row.user_id, row.organization_id);
      load();
      showToast("success", "Gebruiker verwijderd uit de organisatie");
    } catch (err) {
      showToast("error", err.message || "Verwijderen mislukt.");
    } finally {
      setRemoving(null);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const result = await adminApi.addUserToOrganization(newMember);
      setShowForm(false);
      setNewMember(EMPTY_NEW);
      load();
      showToast("success", result.invited ? "Uitnodiging verstuurd en toegevoegd" : "Bestaande gebruiker toegevoegd");
    } catch (err) {
      setCreateError(err.message || "Toevoegen mislukt.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="dp-title">Gebruikers</h1>
          <p className="dp-sub">Alle gekoppelde gebruikers, per organisatie.</p>
        </div>
        <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Gebruiker toevoegen</button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <form onSubmit={addMember} className="dp-grid dp-cols-3" style={{ alignItems: "end" }}>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Organisatie</label>
              <DarkSelect
                value={newMember.organization_id}
                onChange={(val) => setNewMember((f) => ({ ...f, organization_id: val }))}
                options={organizations.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="— Kies een organisatie —"
                searchable
                searchPlaceholder="Zoek organisatie..."
              />
            </div>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">E-mailadres</label>
              <input type="email" className="dp-input" value={newMember.email} onChange={(e) => setNewMember((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="dp-field" style={{ marginBottom: 0 }}>
              <label className="dp-label">Rol</label>
              <DarkSelect
                value={newMember.role}
                onChange={(val) => setNewMember((f) => ({ ...f, role: val }))}
                options={ROLE_OPTIONS}
                hideEmptyOption
              />
            </div>
            {createError && <div className="dp-toast dp-toast-error" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>{createError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="dp-btn" disabled={creating || !newMember.organization_id}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Toevoegen"}
              </button>
              <button type="button" className="dp-btn-ghost" disabled={creating} onClick={() => setShowForm(false)}>Annuleren</button>
            </div>
            <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-dim)", margin: 0 }}>
              Bestaat dit e-mailadres nog niet als VELRIX-account, dan ontvangt de gebruiker een uitnodiging. Bestaat het al, dan wordt diegene direct aan deze organisatie gekoppeld.
            </p>
          </form>
        </div>
      )}

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
          : error ? <div className="dp-empty">{error}</div>
          : rows.length === 0 ? <div className="dp-empty"><div className="dp-empty-icon"><UserCog size={20} /></div>Nog geen gebruikers gekoppeld.</div>
          : (
            <table className="dp-table">
              <thead><tr><th>Gebruiker</th><th>Organisatie</th><th>Rol</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const key = `${r.user_id}-${r.organization_id}`;
                  return (
                    <tr key={key}>
                      <td>{r.email || r.user_id}</td>
                      <td>{r.organizations?.name || r.organization_id}</td>
                      <td style={{ maxWidth: 160 }}>
                        <DarkSelect
                          value={r.role}
                          onChange={(val) => changeRole(r, val)}
                          options={ROLE_OPTIONS}
                          hideEmptyOption
                          disabled={savingRole === key}
                        />
                      </td>
                      <td>
                        <button
                          className="dp-btn-ghost"
                          style={{ padding: "5px 9px", fontSize: 12 }}
                          disabled={removing === key}
                          onClick={() => removeMember(r)}
                        >
                          {removing === key ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={13} /> Verwijderen</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
