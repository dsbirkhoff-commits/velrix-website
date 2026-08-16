import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Client-side redirect for UX only — same disclaimer as RequireAuth.jsx.
 * The REAL security boundary for /admin is server-side: every branch in
 * api/admin/index.js calls requireAdmin() independently, and every new
 * admin table's RLS policy is is_velrix_admin()-only. Even if this
 * component were bypassed entirely, no admin data would be reachable.
 *
 * Assumes it renders INSIDE a RequireAuth boundary (session already
 * guaranteed) — mirrors how RequireAuth itself assumes AuthProvider is
 * already mounted.
 */
export default function RequireVelrixAdmin({ children }) {
  const { profile, isVelrixAdmin } = useAuth();

  // profile is null while still loading (see AuthContext.jsx) — wait
  // for it before deciding, so a real admin doesn't get bounced during
  // the brief window before their profile has loaded.
  if (profile === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
      </div>
    );
  }

  if (!isVelrixAdmin) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return children;
}
