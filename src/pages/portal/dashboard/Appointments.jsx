import React, { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { portalApi } from "../../../lib/portalApi.js";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

function formatDate(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

const STATUS_LABEL = { gepland: "Gepland", bevestigd: "Bevestigd", in_behandeling: "In behandeling", voltooid: "Voltooid", geannuleerd: "Geannuleerd" };
const STATUS_BADGE = { gepland: "dp-badge-gold", bevestigd: "dp-badge-green", in_behandeling: "dp-badge-gold", voltooid: "dp-badge-green", geannuleerd: "dp-badge-red" };

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    portalApi
      .listAppointments()
      .then((data) => setRows(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Mijn afspraken</h1>
        <p className="dp-sub">Alle geplande en afgeronde afspraken van jouw garage.</p>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : error ? (
          <div className="dp-empty">{error}</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><CalendarClock size={20} /></div>
            Er zijn nog geen afspraken.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Datum</th><th>Tijd</th><th>Klant</th><th>Dienst</th><th>Status</th><th>Notities</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.datum)}</td>
                  <td>{r.tijd}{r.eindtijd ? `–${r.eindtijd}` : ""}</td>
                  <td>{r.klantnaam}</td>
                  <td>{r.type}</td>
                  <td><span className={`dp-badge ${STATUS_BADGE[r.status] || "dp-badge-gray"}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                  <td>{r.notities || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
