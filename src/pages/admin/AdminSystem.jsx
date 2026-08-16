import React from "react";
import { Settings2 } from "lucide-react";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

export default function AdminSystem() {
  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title"><Settings2 size={20} style={{ verticalAlign: "-3px", marginRight: 8 }} />Systeem</h1>
        <p className="dp-sub">Minimaal uitgewerkt in deze fase — verdient een apart gesprek zodra er behoefte aan is.</p>
      </div>
      <div className="dp-card">
        <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
          Hier komt later systeemstatus (Supabase-verbinding, Google Calendar-koppelingen per organisatie, functie-limieten, etc.).
        </p>
      </div>
    </div>
  );
}
