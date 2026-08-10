import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Gauge, Loader2, LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (session) {
    return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Inloggen mislukt. Controleer je e-mailadres en wachtwoord.");
      return;
    }
    navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
  };

  return (
    <div className="login-page">
      <style>{`
        .login-page { --ink:#0a0b0d; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          background: var(--ink); min-height:100vh; display:flex; align-items:center; justify-content:center;
          font-family:'Inter',ui-sans-serif,system-ui,sans-serif; padding:20px; }
        .login-card { width:100%; max-width:400px; border:1px solid var(--border); background: var(--surface); border-radius:20px; padding:36px 32px; }
        .login-brand { display:flex; align-items:center; gap:10px; margin-bottom:28px; }
        .login-brand-mark { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; }
        .login-brand-word { font-family:'Fraunces',ui-serif,Georgia,serif; font-weight:600; font-size:19px; color: var(--text); }
        .login-title { font-family:'Fraunces',ui-serif,Georgia,serif; font-size:22px; font-weight:500; color: var(--text); margin-bottom:6px; }
        .login-sub { font-size:13.5px; color: var(--text-muted); margin-bottom:26px; }
        .login-field { margin-bottom:16px; }
        .login-label { display:block; font-size:12.5px; color: var(--text-dim); margin-bottom:6px; }
        .login-input { width:100%; background: #0e1013; border:1px solid var(--border-strong); border-radius:10px; padding:11px 14px; font-size:14px; color: var(--text); outline:none; box-sizing:border-box; }
        .login-input:focus { border-color: var(--gold); }
        .login-error { font-size:12.5px; color:#e6947a; margin-bottom:14px; }
        .login-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:13px; border-radius:10px; border:none; cursor:pointer;
          background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:14.5px; }
        .login-btn:disabled { opacity:.6; cursor:wait; }
        .login-footer { margin-top:20px; text-align:center; font-size:12px; color: var(--text-dim); }
      `}</style>
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark"><Gauge size={17} strokeWidth={2} /></span>
          <span className="login-brand-word">VELRIX</span>
        </div>
        <h1 className="login-title">Inloggen</h1>
        <p className="login-sub">Toegang tot je VELRIX-klantportaal.</p>
        <form onSubmit={submit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">E-mailadres</label>
            <input id="email" type="email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="login-field">
            <label className="login-label" htmlFor="password">Wachtwoord</label>
            <input id="password" type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? "Bezig…" : "Inloggen"}
          </button>
        </form>
        <div className="login-footer">Nog geen toegang? Neem contact op via daniel@velrix.nl</div>
      </div>
    </div>
  );
}
