import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Gauge, LayoutDashboard, Building2, Users, Tags, ListTree, UserCog, CalendarClock, Wrench, Bot, Receipt, CreditCard, Settings2, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/organizations", label: "Organisaties", icon: Building2 },
  { to: "/admin/users", label: "Gebruikers", icon: UserCog },
  { to: "/admin/branches", label: "Branches", icon: Tags },
  { to: "/admin/custom-field-templates", label: "Custom Field Templates", icon: ListTree },
  { to: "/admin/customers", label: "Klanten", icon: Users },
  { to: "/admin/appointments", label: "Afspraken", icon: CalendarClock },
  { to: "/admin/services", label: "Diensten", icon: Wrench },
  { to: "/admin/ai-receptionists", label: "AI Receptionists", icon: Bot },
  { to: "/admin/invoices", label: "Facturen", icon: Receipt },
  { to: "/admin/subscriptions", label: "Abonnementen", icon: CreditCard },
  { to: "/admin/system", label: "Systeem", icon: Settings2 },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0d", color: "#f3f1ec", display: "flex", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        .adm-nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 9px; color: #9a9c9f; text-decoration: none; font-size: 13px; font-weight: 500; }
        .adm-nav-link:hover { background: rgba(255,255,255,.03); color: #f3f1ec; }
        .adm-nav-link.active { background: rgba(201,166,104,.1); color: #e6cd94; }
      `}</style>
      <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid #24272d", padding: "20px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(150deg,#e6cd94,#c9a668)", display: "flex", alignItems: "center", justifyContent: "center", color: "#17130a" }}>
            <Gauge size={16} />
          </span>
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 600, fontSize: 16 }}>VELRIX</span>
        </div>
        <div style={{ padding: "0 8px 20px", fontSize: 11, color: "#6b6d71", letterSpacing: "0.04em", textTransform: "uppercase" }}>Admin Backend</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => "adm-nav-link" + (isActive ? " active" : "")}>
              <item.icon size={15} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid #24272d", paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 11.5, color: "#6b6d71", padding: "0 8px 10px", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
          <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", borderRadius: 9, border: "none", background: "none", color: "#9a9c9f", fontSize: 13, cursor: "pointer" }}>
            <LogOut size={15} /> Uitloggen
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
