import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Plus, Users, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";
import AdminDynamicFields from "../../components/AdminDynamicFields.jsx";

const EMPTY_NEW = { voornaam: "", achternaam: "", email: "", telefoonnummer: "", notities: "", custom_fields: {} };

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgIdFromUrl = searchParams.get("organization_id") || "";

  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState(orgIdFromUrl);
  const [schema, setSchema] = useState([]);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [showForm, setShowForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_NEW);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    adminApi.listOrganizations().then(setOrganizations).catch(() => {});
  }, []);

  const load = () => {
    if (!orgId) { setRows(null); return; }
    setLoading(true);
    setError(null);
    Promise.all([adminApi.listOrgCustomers(orgId), adminApi.getOrganization(orgId)])
      .then(([customers, org]) => {
        setRows(customers);
        setSchema(org.custom_fields_schema || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [orgId]);

  useEffect(() => { setShowForm(false); setNewCustomer(EMPTY_NEW); setCreateError(null); setQuery(""); }, [orgId]);

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    let filtered = !q ? rows : rows.filter((c) =>
      (c.naam || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.telefoonnummer || "").toLowerCase().includes(q)
    );
    filtered = [...filtered];
    if (sortBy === "name") filtered.sort((a, b) => (a.naam || "").localeCompare(b.naam || ""));
    else if (sortBy === "newest") filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return filtered;
  }, [rows, query, sortBy]);

  const createCustomer = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.createOrgCustomer({ organization_id: orgId, ...newCustomer });
      setShowForm(false);
      setNewCustomer(EMPTY_NEW);
      load();
    } catch (err) {
      setCreateError(err.message || "Aanmaken mislukt.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Klanten</h1>
        <p className="dp-sub">Kies eerst een organisatie om haar klanten te beheren.</p>
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

      {!orgId ? null : (
        <>
          <div className="dp-card" style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <label className="dp-label">Zoeken</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
                <input
                  className="dp-input"
                  style={{ paddingLeft: 34 }}
                  placeholder="Naam, e-mail of telefoon..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
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
                  { value: "name", label: "Naam (A-Z)" },
                ]}
                hideEmptyOption
              />
            </div>
            <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe klant</button>
          </div>

          {showForm && (
            <div className="dp-card" style={{ marginBottom: 16 }}>
              <form onSubmit={createCustomer}>
                <div className="dp-grid dp-cols-3">
                  <div className="dp-field"><label className="dp-label">Voornaam</label><input className="dp-input" value={newCustomer.voornaam} onChange={(e) => setNewCustomer((f) => ({ ...f, voornaam: e.target.value }))} /></div>
                  <div className="dp-field"><label className="dp-label">Achternaam</label><input className="dp-input" value={newCustomer.achternaam} onChange={(e) => setNewCustomer((f) => ({ ...f, achternaam: e.target.value }))} required /></div>
                  <div className="dp-field"><label className="dp-label">E-mail</label><input type="email" className="dp-input" value={newCustomer.email} onChange={(e) => setNewCustomer((f) => ({ ...f, email: e.target.value }))} /></div>
                  <div className="dp-field"><label className="dp-label">Telefoon</label><input className="dp-input" value={newCustomer.telefoonnummer} onChange={(e) => setNewCustomer((f) => ({ ...f, telefoonnummer: e.target.value }))} /></div>
                  <AdminDynamicFields
                    schema={schema}
                    values={newCustomer.custom_fields}
                    onChange={(key, val) => setNewCustomer((f) => ({ ...f, custom_fields: { ...f.custom_fields, [key]: val } }))}
                    disabled={creating}
                  />
                </div>
                <div className="dp-field"><label className="dp-label">Notities</label><textarea className="dp-input" rows={2} value={newCustomer.notities} onChange={(e) => setNewCustomer((f) => ({ ...f, notities: e.target.value }))} /></div>
                {createError && <div className="dp-toast dp-toast-error" style={{ marginBottom: 12 }}>{createError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="dp-btn" disabled={creating}>{creating ? <Loader2 size={14} className="animate-spin" /> : "Aanmaken"}</button>
                  <button type="button" className="dp-btn-ghost" disabled={creating} onClick={() => setShowForm(false)}>Annuleren</button>
                </div>
              </form>
            </div>
          )}

          <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>
              : error ? <div className="dp-empty">{error}</div>
              : visibleRows.length === 0 ? (
                <div className="dp-empty">
                  <div className="dp-empty-icon"><Users size={20} /></div>
                  {query ? "Geen klanten gevonden voor deze zoekopdracht." : "Deze organisatie heeft nog geen klanten."}
                </div>
              ) : (
                <table className="dp-table">
                  <thead><tr><th>Naam</th><th>E-mail</th><th>Telefoon</th><th>Status</th></tr></thead>
                  <tbody>
                    {visibleRows.map((c) => (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/customers/${c.id}`)}>
                        <td>{c.naam}</td>
                        <td>{c.email || "—"}</td>
                        <td>{c.telefoonnummer || "—"}</td>
                        <td><span className={`dp-badge ${c.status === "actief" ? "dp-badge-green" : "dp-badge-gray"}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}
    </div>
  );
}
