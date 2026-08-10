import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

/** Client-side redirect for UX only — see AuthContext.jsx for why the
 * real security boundary is Postgres RLS, not this component. */
export default function RequireAuth({ children }) {
  const { session } = useAuth();
  const location = useLocation();

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return children;
}
