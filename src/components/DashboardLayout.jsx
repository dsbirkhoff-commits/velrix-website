import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Gauge, LayoutDashboard, CalendarClock, Users, Bot, Settings, LogOut, ShieldCheck, Loader2, AlertTriangle, Wrench, Receipt } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const NAV = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/portal/appointments", label: "Afspraken", icon: CalendarClock },
  { to: "/portal/customers", label: "Klanten", icon: Users },
  { to: "/portal/services", label: "Diensten", icon: Wrench },
  { to: "/portal/ai-receptionist", label: "AI Receptionist", icon: Bot },
  { to: "/portal/invoices", label: "Facturen", icon: Receipt },
  { to: "/portal/settings", label: "Instellingen", icon: Settings },
];

export default function DashboardLayout() {
  const { user, membership, isVelrixAdmin, loadingMembership, signOut } = useAuth();

  // FIX (zie audit): eerder bleven alle 6 pagina's voor altijd op "Laden…"
  // staan als membership nooit oploste (ontbrekende memberships-rij,
  // RLS-probleem, netwerkfout) — geen foutmelding, geen empty state, de
  // pagina leek gewoon bevroren. Die afhandeling zit nu centraal hier,
  // vóórdat de zes pagina's zelf ooit renderen, in plaats van in elke
  // pagina apart (waar hij zes keer consistent moest kloppen en dat niet
  // deed).
  if (loadingMembership) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
      </div>
    );
  }

  if (!membership && !isVelrixAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d", padding: 20 }}>
        <div style={{ maxWidth: 420, textAlign: "center", color: "#f3f1ec", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          <AlertTriangle size={26} style={{ color: "#e6947a", marginBottom: 14 }} />
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 500, marginBottom: 8 }}>Geen organisatie gekoppeld</h1>
          <p style={{ fontSize: 13.5, color: "#9a9c9f", lineHeight: 1.6 }}>
            Dit account (<strong>{user?.email}</strong>) is ingelogd, maar hoort nog niet bij een organisatie in VELRIX. Neem
            contact op via <a href="mailto:daniel@velrix.nl" style={{ color: "#e6cd94" }}>daniel@velrix.nl</a> om dit te
            laten koppelen.
          </p>
          <button
            onClick={signOut}
            style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "1px solid #34383f", background: "none", color: "#f3f1ec", cursor: "pointer", fontSize: 13 }}
          >
            <LogOut size={14} /> Uitloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <style>{`
        .dash-shell { --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          --green:#6fd18a; --red:#e6947a;
          background: var(--ink); min-height:100vh; color: var(--text); font-family:'Inter',ui-sans-serif,system-ui,sans-serif; display:flex; }
        .dash-shell h1, .dash-shell h2 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .dash-sidebar { width:240px; flex-shrink:0; border-right:1px solid var(--border); background: var(--surface); display:flex; flex-direction:column; padding:22px 14px; position:sticky; top:0; height:100vh; }
        .dash-brand { display:flex; align-items:center; gap:9px; padding:0 8px 22px; }
        .dash-brand-mark { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; flex-shrink:0; }
        .dash-brand-word { font-family:'Fraunces',serif; font-weight:600; font-size:16px; }
        .dash-org { padding:0 8px 18px; border-bottom:1px solid var(--border); margin-bottom:14px; }
        .dash-org-name { font-size:13px; font-weight:600; color: var(--text); }
        .dash-org-role { font-size:11px; color: var(--text-dim); margin-top:2px; text-transform:capitalize; }
        .dash-nav { display:flex; flex-direction:column; gap:2px; flex:1; }
        .dash-nav-link { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:9px; color: var(--text-muted); font-size:13.5px; text-decoration:none; }
        .dash-nav-link:hover { background: rgba(255,255,255,.03); color: var(--text); }
        .dash-nav-link.active { background: rgba(201,166,104,.1); color: var(--gold-bright); font-weight:500; }
        .dash-user { padding:12px 8px 0; border-top:1px solid var(--border); margin-top:10px; }
        .dash-user-email { font-size:11.5px; color: var(--text-dim); word-break:break-all; margin-bottom:8px; }
        .dash-logout { display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border-radius:9px; border:1px solid var(--border-strong); background:none; color: var(--text-muted); font-size:12.5px; cursor:pointer; }
        .dash-logout:hover { border-color: var(--red); color: var(--red); }
        .dash-main { flex:1; min-width:0; padding:36px 40px; max-width:1280px; }
        @media (max-width: 900px) { .dash-sidebar { width:76px; padding:18px 8px; } .dash-brand-word, .dash-org, .dash-nav-link span, .dash-user-email { display:none; } .dash-nav-link { justify-content:center; } .dash-main { padding:24px 20px; } }
      `}</style>

      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-mark"><Gauge size={15} strokeWidth={2} /></span>
          <span className="dash-brand-word">VELRIX</span>
        </div>
        <div className="dash-org">
          <div className="dash-org-name">{membership?.organizations?.name || (isVelrixAdmin ? "VELRIX (admin)" : "…")}</div>
          <div className="dash-org-role" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {isVelrixAdmin && <ShieldCheck size={11} style={{ color: "var(--gold)" }} />}
            {isVelrixAdmin ? "VELRIX admin" : membership?.role || ""}
          </div>
        </div>
        <nav className="dash-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `dash-nav-link ${isActive ? "active" : ""}`}>
              <item.icon size={16} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dash-user">
          <div className="dash-user-email">{user?.email}</div>
          <button className="dash-logout" onClick={signOut}><LogOut size={14} /> Uitloggen</button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
