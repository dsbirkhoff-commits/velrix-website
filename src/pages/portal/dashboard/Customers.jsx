import React, { useEffect, useState } from "react";
import { Users, Loader2, Plus, X, Check, Pencil, Trash2 } from "lucide-react";
import { portalApi } from "../../../lib/portalApi.js";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

const CORE_EMPTY_FORM = { voornaam: "", achternaam: "", email: "", telefoonnummer: "", notities: "" };

/**
 * Rendert de branche-specifieke velden puur op basis van het schema dat
 * de organisatie van VELRIX heeft gekregen (custom_field_definitions).
 * Geen enkele branche-specifieke code-tak hier — nieuwe branches werken
 * automatisch zodra VELRIX-admin er een schema voor aanmaakt.
 */
function DynamicFieldsSection({ schema, values, onChange }) {
  if (!schema || schema.length === 0) return null;
  return (
    <>
      {schema.filter((f) => f.visible !== false).map((field) => {
        const val = values[field.field_key] ?? "";
        const setVal = (v) => onChange(field.field_key, v);
        if (field.data_type === "select") {
          return (
            <div className="dp-field" key={field.field_key}>
              <label className="dp-label">{field.label}{field.required && " *"}</label>
              <select className="dp-select" value={val} onChange={(e) => setVal(e.target.value)}>
                <option value="">—</option>
                {(field.options || []).map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </div>
          );
        }
        if (field.data_type === "boolean") {
          return (
            <div className="dp-field" key={field.field_key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={Boolean(val)} onChange={(e) => setVal(e.target.checked)} />
              <label className="dp-label" style={{ marginBottom: 0 }}>{field.label}</label>
            </div>
          );
        }
        return (
          <div className="dp-field" key={field.field_key}>
            <label className="dp-label">{field.label}{field.required && " *"}</label>
            <input
              type={field.data_type === "number" ? "number" : field.data_type === "date" ? "date" : "text"}
              className="dp-input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
}

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [schema, setSchema] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(CORE_EMPTY_FORM);
  const [newCustomFields, setNewCustomFields] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(CORE_EMPTY_FORM);
  const [editCustomFields, setEditCustomFields] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([portalApi.listCustomers(), portalApi.getCustomFieldsSchema()])
      .then(([customersData, schemaData]) => {
        setRows(customersData);
        setSchema(schemaData);
      })
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
    if (!newForm.voornaam.trim() && !newForm.achternaam.trim()) return;
    setAdding(true);
    try {
      const created = await portalApi.createCustomer({ ...newForm, custom_fields: newCustomFields });
      setRows((r) => [created, ...r]);
      setNewForm(CORE_EMPTY_FORM);
      setNewCustomFields({});
      setShowForm(false);
      showToast("success", "Opgeslagen");
    } catch (err) {
      showToast("error", err.message || "Toevoegen mislukt.");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      voornaam: row.voornaam || "", achternaam: row.achternaam || "", email: row.email || "",
      telefoonnummer: row.telefoonnummer || "", notities: row.notities || "",
    });
    setEditCustomFields(row.custom_fields || {});
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const updated = await portalApi.updateCustomer(id, { ...editForm, custom_fields: editCustomFields });
      setRows((r) => r.map((row) => (row.id === id ? updated : row)));
      setEditingId(null);
      showToast("success", "Opgeslagen");
    } catch (err) {
      showToast("error", err.message || "Bijwerken mislukt.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Deze klant verwijderen?")) return;
    setBusyId(id);
    try {
      await portalApi.deleteCustomer(id);
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
      <div className="dp-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="dp-title">Klanten</h1>
          <p className="dp-sub">De klanten van jouw bedrijf.</p>
        </div>
        <button className="dp-btn" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Nieuwe klant</button>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      {showForm && (
        <div className="dp-card" style={{ marginBottom: 16 }}>
          <div className="dp-section-title">Nieuwe klant</div>
          <form onSubmit={submitNew}>
            <div className="dp-grid dp-cols-4" style={{ marginBottom: 4 }}>
              <div className="dp-field"><label className="dp-label">Voornaam</label><input className="dp-input" value={newForm.voornaam} onChange={(e) => setNewForm((f) => ({ ...f, voornaam: e.target.value }))} required /></div>
              <div className="dp-field"><label className="dp-label">Achternaam</label><input className="dp-input" value={newForm.achternaam} onChange={(e) => setNewForm((f) => ({ ...f, achternaam: e.target.value }))} /></div>
              <div className="dp-field"><label className="dp-label">E-mail</label><input type="email" className="dp-input" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="dp-field"><label className="dp-label">Telefoonnummer</label><input className="dp-input" value={newForm.telefoonnummer} onChange={(e) => setNewForm((f) => ({ ...f, telefoonnummer: e.target.value }))} /></div>
            </div>
            {schema.length > 0 && (
              <div className="dp-grid dp-cols-4" style={{ marginBottom: 4 }}>
                <DynamicFieldsSection schema={schema} values={newCustomFields} onChange={(k, v) => setNewCustomFields((f) => ({ ...f, [k]: v }))} />
              </div>
            )}
            <div className="dp-field"><label className="dp-label">Notities</label><input className="dp-input" value={newForm.notities} onChange={(e) => setNewForm((f) => ({ ...f, notities: e.target.value }))} /></div>
            <button type="submit" className="dp-btn" disabled={adding}>{adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Klant toevoegen</button>
          </form>
        </div>
      )}

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : error ? (
          <div className="dp-empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Users size={20} /></div>
            Nog geen klanten. Klik op "Nieuwe klant" om je eerste klant toe te voegen.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr>
                <th>Naam</th><th>Contact</th>
                {schema.filter((f) => f.visible !== false).map((f) => (<th key={f.field_key}>{f.label}</th>))}
                <th>Notities</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {editingId === row.id ? (
                    <>
                      <td style={{ display: "flex", gap: 6 }}>
                        <input className="dp-input" style={{ width: 90 }} value={editForm.voornaam} onChange={(e) => setEditForm((f) => ({ ...f, voornaam: e.target.value }))} />
                        <input className="dp-input" style={{ width: 90 }} value={editForm.achternaam} onChange={(e) => setEditForm((f) => ({ ...f, achternaam: e.target.value }))} />
                      </td>
                      <td>
                        <input className="dp-input" style={{ marginBottom: 4 }} value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-mail" />
                        <input className="dp-input" value={editForm.telefoonnummer} onChange={(e) => setEditForm((f) => ({ ...f, telefoonnummer: e.target.value }))} placeholder="Telefoon" />
                      </td>
                      {schema.filter((f) => f.visible !== false).map((f) => (
                        <td key={f.field_key}>
                          <input className="dp-input" style={{ width: 110 }} value={editCustomFields[f.field_key] ?? ""} onChange={(e) => setEditCustomFields((cf) => ({ ...cf, [f.field_key]: e.target.value }))} />
                        </td>
                      ))}
                      <td><input className="dp-input" value={editForm.notities} onChange={(e) => setEditForm((f) => ({ ...f, notities: e.target.value }))} /></td>
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
                      <td>{row.email || "—"}{row.telefoonnummer ? ` · ${row.telefoonnummer}` : ""}</td>
                      {schema.filter((f) => f.visible !== false).map((f) => (
                        <td key={f.field_key}>{row.custom_fields?.[f.field_key] ?? "—"}</td>
                      ))}
                      <td>{row.notities || "—"}</td>
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
