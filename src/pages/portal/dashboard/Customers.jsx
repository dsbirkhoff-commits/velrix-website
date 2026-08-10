import React, { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

export default function Customers() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    supabase
      .from("customers")
      .select("id, naam, email, telefoonnummer, laatste_contact, aantal_afspraken, status")
      .eq("organization_id", orgId)
      .order("laatste_contact", { ascending: false, nullsFirst: false })
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
        <h1 className="dp-title">Klanten</h1>
        <p className="dp-sub">Iedereen die via de website een kennismaking heeft geboekt.</p>
      </div>

      <div className="dp-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="dp-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 12px" }} /><br />Laden…</div>
        ) : rows.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon"><Users size={20} /></div>
            Nog geen klanten. Zodra iemand een kennismaking boekt, verschijnt die hier automatisch.
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr><th>Naam</th><th>E-mail</th><th>Telefoon</th><th>Laatste contact</th><th>Afspraken</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.naam}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.telefoonnummer || "—"}</td>
                  <td>{r.laatste_contact ? new Date(r.laatste_contact).toLocaleDateString("nl-NL") : "—"}</td>
                  <td>{r.aantal_afspraken}</td>
                  <td><span className={`dp-badge ${r.status === "actief" ? "dp-badge-green" : "dp-badge-gray"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
