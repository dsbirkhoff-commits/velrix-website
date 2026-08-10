import React, { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

function formatDate(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

const STATUS_BADGE = {
  bevestigd: "dp-badge-green",
  voltooid: "dp-badge-gold",
  geannuleerd: "dp-badge-red",
};

export default function Appointments() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    supabase
      .from("appointments")
      .select("id, datum, tijd, klantnaam, email, telefoonnummer, type, status")
      .eq("organization_id", orgId)
      .order("datum", { ascending: true })
      .order("tijd", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error(error);
        setRows(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orgId]);

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Afspraken</h1>
        <p className="dp-sub">Afspraken geboekt via de VELRIX-website, gesynchroniseerd met Google Calendar.</p>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><CalendarClock size={20} /></div>
            Je afspraken verschijnen hier. Zodra iemand via de website een kennismaking boekt, staat 'm hier automatisch.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Datum</th><th>Tijd</th><th>Klant</th><th>E-mail</th><th>Telefoon</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.datum)}</td>
                  <td>{r.tijd}</td>
                  <td>{r.klantnaam}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.telefoonnummer || "—"}</td>
                  <td>{r.type}</td>
                  <td><span className={`dp-badge ${STATUS_BADGE[r.status] || "dp-badge-gray"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
