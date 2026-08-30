import React from "react";
import DarkSelect from "./DarkSelect.jsx";

/**
 * Admin-eigen variant van de dynamische custom-fields-renderer.
 * Bewust een APARTE component van de gelijknamige, lokale
 * DynamicFieldsSection in src/pages/portal/dashboard/Customers.jsx —
 * die gebruikt een native <select> (prima in de lichte portal-styling),
 * hier gebruiken we DarkSelect zodat het datatype "select" er in de
 * donkere Admin Backend niet als een witte browser-dropdown uitziet.
 * Nul wijziging aan de Portal-versie, geen gedeeld risico.
 */
export default function AdminDynamicFields({ schema, values, onChange, disabled = false }) {
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
              <DarkSelect
                value={val}
                onChange={setVal}
                options={(field.options || []).map((o) => ({ value: o.value, label: o.label }))}
                placeholder="—"
                disabled={disabled}
              />
            </div>
          );
        }
        if (field.data_type === "boolean") {
          return (
            <div className="dp-field" key={field.field_key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={Boolean(val)} disabled={disabled} onChange={(e) => setVal(e.target.checked)} />
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
              disabled={disabled}
              onChange={(e) => setVal(e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
}
