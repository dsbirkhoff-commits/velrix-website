import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, Loader2, KeyRound, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";

/**
 * Handles both flows that land here with a Supabase recovery/invite token
 * in the URL:
 *   1. "Invite user" (Supabase Dashboard -> Authentication -> Users, of
 *      via de VELRIX Admin Backend) — de allereerste keer dat een account
 *      zelf een wachtwoord instelt.
 *   2. "Forgot password" (self-service, getriggerd vanuit PortalLogin.jsx)
 *      — elk moment daarna.
 * Supabase's client library detecteert de token in de URL automatisch bij
 * het laden en zet een tijdelijke sessie op — deze pagina hoeft alleen
 * updateUser({ password }) aan te roepen zolang die sessie actief is. Geen
 * enkel wachtwoord staat ooit hardcoded in deze codebase.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // FIX (zie eerdere audit): de fallback beschouwt niet elke actieve
    // sessie als bewijs van een geldige link — een al ingelogde gebruiker
    // die deze URL rechtstreeks bezoekt (geen token in de URL) mag hier
    // niet zomaar een nieuw wachtwoord kunnen zetten. Daarom blijft de
    // fallback gebonden aan een daadwerkelijk herkend token-type in de
    // hash (#...&type=recovery OF #...&type=invite — beide tellen mee,
    // zie hieronder waarom).
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const linkType = params.get("type");
    const isTokenLink = linkType === "recovery" || linkType === "invite";

    // FIX (dit incident): "wachtwoord vergeten"-links geven betrouwbaar
    // het PASSWORD_RECOVERY-event. Een VELRIX-uitnodigingslink (nieuwe
    // organisatie -> eigenaar uitnodigen) gebruikt echter een ander
    // Supabase-mechanisme — daarbij is SIGNED_IN het event dat
    // daadwerkelijk afgaat, niet PASSWORD_RECOVERY (bevestigd door
    // Supabase zelf: bij invite/recovery-links vuurt SIGNED_IN vóór
    // PASSWORD_RECOVERY, en voor invites specifiek is dat het enige
    // betrouwbare signaal). SIGNED_IN reageert alleen op een sessie die
    // TIJDENS de levensduur van deze listener ontstaat — een reeds
    // bestaande, van tevoren ingelogde sessie triggert dit niet (die
    // geeft hooguit INITIAL_SESSION, waar hier bewust niet op wordt
    // gereageerd), dus de beveiligingsgarantie hierboven blijft intact.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    if (isTokenLink) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    if (password !== confirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("Kon het wachtwoord niet instellen. Vraag een nieuwe link aan en probeer het opnieuw.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/portal/dashboard", { replace: true }), 1500);
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
        .login-success { display:flex; align-items:center; gap:8px; color:#6fd18a; font-size:13.5px; }
      `}</style>
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark"><Gauge size={17} strokeWidth={2} /></span>
          <span className="login-brand-word">VELRIX</span>
        </div>

        {!ready ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13.5 }}>
            <Loader2 size={16} className="animate-spin" /> Link controleren…
          </div>
        ) : done ? (
          <div className="login-success"><Check size={16} /> Wachtwoord ingesteld — je wordt doorgestuurd…</div>
        ) : (
          <>
            <h1 className="login-title">Wachtwoord instellen</h1>
            <p className="login-sub">Kies een wachtwoord om toegang te krijgen tot je VELRIX-klantportaal.</p>
            <form onSubmit={submit}>
              <div className="login-field">
                <label className="login-label" htmlFor="password">Nieuw wachtwoord</label>
                <input id="password" type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="confirm">Herhaal wachtwoord</label>
                <input id="confirm" type="password" className="login-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {loading ? "Bezig…" : "Wachtwoord instellen"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
