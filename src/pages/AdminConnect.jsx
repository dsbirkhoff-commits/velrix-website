import React, { useState } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";

// Deliberately not linked from any nav/footer/sitemap — this is an
// owner-only utility page, not a public feature. Reachable only by typing
// the URL (plus the required ?key=) directly.
export default function AdminConnect() {
  const [key, setKey] = useState("");

  const connect = () => {
    const url = `/api/auth/google/start?key=${encodeURIComponent(key)}`;
    window.location.href = url;
  };

  return (
    <div style={{ background: "#0a0b0d", color: "#f3f1ec", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 440, width: "100%", border: "1px solid #24272d", background: "#15171b", borderRadius: 18, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={18} style={{ color: "#c9a668" }} />
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11.5, color: "#9a9c9f", letterSpacing: "0.04em" }}>ALLEEN VOOR VELRIX-BEHEER</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 500, margin: "10px 0 8px" }}>Koppel Google Agenda</h1>
        <p style={{ fontSize: 13.5, color: "#9a9c9f", lineHeight: 1.6, marginBottom: 22 }}>
          Verbindt jouw primaire Google Calendar met de VELRIX-boekingsflow via de officiële Google-inlogpagina.
          Je wachtwoord komt nooit bij VELRIX terecht.
        </p>
        <label style={{ fontSize: 12, color: "#6b6d71", display: "block", marginBottom: 6 }}>Setup-sleutel</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ADMIN_SETUP_SECRET"
          style={{ width: "100%", background: "#0e1013", border: "1px solid #34383f", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f3f1ec", outline: "none", marginBottom: 18 }}
        />
        <button
          onClick={connect}
          disabled={!key}
          style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", borderRadius: 10, border: "none", cursor: key ? "pointer" : "not-allowed", opacity: key ? 1 : 0.5, background: "linear-gradient(150deg,#e6cd94,#c9a668)", color: "#17130a", fontWeight: 600, fontSize: 14.5 }}
        >
          <CalendarClock size={16} /> Koppel Google Agenda
        </button>
        <p style={{ fontSize: 11.5, color: "#6b6d71", marginTop: 16, lineHeight: 1.6 }}>
          Je wordt doorgestuurd naar Google's eigen inlog- en toestemmingsscherm. Na goedkeuring kom je terug op een
          bevestigingspagina met de vervolgstap.
        </p>
      </div>
    </div>
  );
}
