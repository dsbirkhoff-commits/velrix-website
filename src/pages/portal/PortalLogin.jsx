import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Gauge, Loader2, LogIn } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Login() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // FIX (zie audit): session===undefined betekent "nog aan het checken of
  // er al een sessie is" — dat gaf eerder een korte flits van het
  // loginformulier te zien voor iemand die al ingelogd was, vóórdat de
  // redirect naar het dashboard plaatsvond.
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
      </div>
    );
  }

  if (session) {
    return <Navigate to={location.state?.from?.pathname || "/portal/dashboard"} replace />;
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
    navigate(location.state?.from?.pathname || "/portal/dashboard", { replace: true });
  };

  const sendResetLink = async () => {
    if (!email) {
      setError("Vul eerst je e-mailadres in, dan sturen we een link om je wachtwoord in te stellen.");
      return;
    }
    setError(null);
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setResetLoading(false);
    // Bewust altijd dezelfde melding, ongeacht of het account bestaat —
    // voorkomt dat bezoekers kunnen aftasten welke e-mailadressen wel of
    // niet een VELRIX-account hebben.
    setResetSent(true);
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
        .login-forgot { display:block; text-align:center; margin-top:14px; font-size:12.5px; color: var(--text-dim); background:none; border:none; cursor:pointer; padding:0; }
        .login-forgot:hover { color: var(--gold-bright); }
        .login-reset-sent { font-size:12.5px; color:#6fd18a; text-align:center; margin-top:14px; }
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
        {resetSent ? (
          <div className="login-reset-sent">Als dit e-mailadres een VELRIX-account heeft, is er een link verstuurd om een wachtwoord in te stellen.</div>
        ) : (
          <button type="button" className="login-forgot" onClick={sendResetLink} disabled={resetLoading}>
            {resetLoading ? "Bezig…" : "Wachtwoord vergeten of nog geen wachtwoord ingesteld?"}
          </button>
        )}
        <div className="login-footer">Nog geen toegang? Neem contact op via daniel@velrix.nl</div>
      </div>
    </div>
  );
}
