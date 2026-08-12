import React, { useEffect, useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

export default function Calls() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; } // FIX: voorkomt oneindig "Laden…" als orgId nooit een waarde krijgt (zie audit)
    let cancelled = false;
    supabase
      .from("calls")
      .select("id, datum_tijd, caller, duration_seconds, status, summary, outcome")
      .eq("organization_id", orgId)
      .order("datum_tijd", { ascending: false })
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
        <h1 className="dp-title">Gesprekken</h1>
        <p className="dp-sub">Telefoongesprekken afgehandeld door VELRIX Reception.</p>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Phone size={20} /></div>
            Je gesprekken verschijnen hier zodra VELRIX Reception actief is.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Datum/tijd</th><th>Beller</th><th>Duur</th><th>Status</th><th>Samenvatting</th><th>Uitkomst</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.datum_tijd).toLocaleString("nl-NL")}</td>
                  <td>{r.caller || "—"}</td>
                  <td>{r.duration_seconds ? `${Math.round(r.duration_seconds / 60)} min` : "—"}</td>
                  <td><span className="dp-badge dp-badge-gray">{r.status}</span></td>
                  <td>{r.summary || "—"}</td>
                  <td>{r.outcome || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
