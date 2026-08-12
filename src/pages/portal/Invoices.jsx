import React, { useEffect, useState } from "react";
import { Receipt, Loader2, ExternalLink } from "lucide-react";
import { portalApi } from "../../lib/portalApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const STATUS_LABEL = { openstaand: "Openstaand", betaald: "Betaald", verlopen: "Verlopen" };
const STATUS_BADGE = { openstaand: "dp-badge-gold", betaald: "dp-badge-green", verlopen: "dp-badge-red" };

function formatDate(dateISO) {
  if (!dateISO) return "—";
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
function formatAmount(n) {
  if (n === null || n === undefined) return "—";
  return `€${Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Invoices() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    portalApi
      .listInvoices()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Mijn facturen</h1>
        <p className="dp-sub">Facturen van VELRIX aan jouw garage.</p>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : error ? (
          <div className="dp-empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Receipt size={20} /></div>
            Je facturen verschijnen hier zodra je eerste factuur beschikbaar is.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Factuurnummer</th><th>Datum</th><th>Omschrijving</th><th>Bedrag</th><th>Vervaldatum</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{formatDate(inv.issue_date)}</td>
                  <td>{inv.description || "—"}</td>
                  <td>{formatAmount(inv.total)}</td>
                  <td>{formatDate(inv.due_date)}</td>
                  <td><span className={`dp-badge ${STATUS_BADGE[inv.status] || "dp-badge-gray"}`}>{STATUS_LABEL[inv.status] || inv.status}</span></td>
                  <td>
                    {inv.pdf_url ? (
                      <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="dp-btn-ghost" style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none", display: "inline-flex" }}>
                        Bekijk factuur <ExternalLink size={12} style={{ marginLeft: 6 }} />
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
