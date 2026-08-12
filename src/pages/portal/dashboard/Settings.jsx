import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, CalendarClock, Users, Bell, Check, Loader2, Wrench, ArrowRight } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

export default function Settings() {
  const { user, membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [calendar, setCalendar] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; } // FIX: voorkomt oneindig "Laden…" als orgId nooit een waarde krijgt (zie audit)
    let cancelled = false;
    Promise.all([
      supabase.from("calendar_connections").select("status, google_account_email, calendar_id, timezone").eq("organization_id", orgId).maybeSingle(),
      supabase.from("memberships").select("user_id, role").eq("organization_id", orgId),
    ]).then(([calRes, memRes]) => {
      if (cancelled) return;
      setCalendar(calRes.data || { status: "not_connected" });
      setMembers(memRes.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">Instellingen</h1>
        <p className="dp-sub">Beheer van {membership?.organizations?.name || "je organisatie"}.</p>
      </div>

      <div className="dp-grid dp-cols-3" style={{ marginBottom: 16 }}>
        <Link to="/portal/settings/company" className="dp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 500 }}><Building2 size={16} /> Bedrijf</span>
          <ArrowRight size={14} style={{ color: "var(--text-dim)" }} />
        </Link>
        <Link to="/portal/services" className="dp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 500 }}><Wrench size={16} /> Diensten</span>
          <ArrowRight size={14} style={{ color: "var(--text-dim)" }} />
        </Link>
        <Link to="/portal/settings/appointments" className="dp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 500 }}><CalendarClock size={16} /> Afspraken</span>
          <ArrowRight size={14} style={{ color: "var(--text-dim)" }} />
        </Link>
      </div>

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><Building2 size={15} /> Bedrijfsgegevens</div>
          <div className="dp-field">
            <label className="dp-label">Organisatienaam</label>
            <input className="dp-input" value={membership?.organizations?.name || ""} disabled />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Bedrijfsnaam, adres en openingstijden voor de AI Receptionist beheer je op de pagina <strong>AI Receptionist</strong>.</p>
        </div>

        <div className="dp-card">
          <div className="dp-section-title"><Mail size={15} /> E-mail</div>
          <div className="dp-field">
            <label className="dp-label">Ingelogd als</label>
            <input className="dp-input" value={user?.email || ""} disabled />
          </div>
        </div>
      </div>

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><CalendarClock size={15} /> Google Calendar</div>
          {calendar?.status === "connected" ? (
            <>
              <div style={{ marginBottom: 10 }}><span className="dp-badge dp-badge-green"><Check size={11} /> Verbonden met VELRIX</span></div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                Agenda: <strong>{calendar.calendar_id || "primary"}</strong><br />
                Tijdzone: <strong>{calendar.timezone || "Europe/Amsterdam"}</strong>
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}><span className="dp-badge dp-badge-gray">Niet gekoppeld</span></div>
              <button className="dp-btn-ghost" disabled style={{ opacity: 0.5, cursor: "not-allowed", width: "100%", justifyContent: "center" }}>
                Google Calendar koppelen
              </button>
              <p style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 10 }}>
                Deze functie wordt beschikbaar bij het activeren van VELRIX voor jouw organisatie.
              </p>
            </>
          )}
        </div>

        <div className="dp-card">
          <div className="dp-section-title"><Users size={15} /> Gebruikers</div>
          {members.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Geen gebruikers gevonden.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map((m) => (
                <li key={m.user_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{m.user_id === user?.id ? `${user.email} (jij)` : m.user_id}</span>
                  <span className="dp-badge dp-badge-gray">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dp-card">
        <div className="dp-section-title"><Bell size={15} /> Notificaties</div>
        <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Notificatie-instellingen komen binnenkort beschikbaar.</p>
      </div>
    </div>
  );
}
