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
 *
 * FIX (sessieconflict): supabaseClient.js heeft detectSessionInUrl UIT
 * staan — deze pagina verwerkt de token uit de URL nu volledig zelf,
 * expliciet, in gegarandeerde volgorde:
 *   1. Foutformaat herkennen (#error=...&error_code=otp_expired&...) —
 *      Supabase's eigen formaat voor een verlopen/ongeldige link.
 *   2. Geldige token herkennen (#access_token=...&refresh_token=...&
 *      type=recovery|invite) — beide officieel bevestigde Supabase-
 *      formaten, letterlijk hetzelfde voor beide linktypes.
 *   3. Een eventuele BESTAANDE sessie EERST expliciet beëindigen
 *      (signOut), pas DAARNA de nieuwe sessie uit DEZE URL instellen
 *      (setSession) — dit is de kern van de fix: een al-ingelogde
 *      gebruiker in dezelfde browser kan de invite/recovery-sessie
 *      hierdoor niet meer kapen, want er is geen moment meer waarop
 *      Supabase zelf, buiten onze controle om, moet "kiezen" tussen twee
 *      sessies.
 *   4. De token uit de URL opruimen zodra 'ie verwerkt is (geen
 *      hergebruik bij een refresh, geen gevoelige tokens zichtbaar in de
 *      adresbalk).
 * Geen enkel wachtwoord staat ooit hardcoded in deze codebase.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false; // voorkomt dubbele state-updates (StrictMode-dubbelrender / unmount)

    async function processUrlToken() {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);

      // Supabase's eigen foutformaat voor een verlopen/al-gebruikte link:
      // #error=access_denied&error_code=otp_expired&error_description=...
      const errorCode = params.get("error_code") || params.get("error");
      if (errorCode) {
        if (cancelled) return;
        setError(
          errorCode === "otp_expired"
            ? "Deze link is verlopen of al eerder gebruikt. Vraag een nieuwe uitnodiging of wachtwoord-resetlink aan."
            : "Deze link is ongeldig. Vraag een nieuwe uitnodiging of wachtwoord-resetlink aan."
        );
        setLinkInvalid(true);
        setReady(true);
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const linkType = params.get("type");
      const isTokenLink = (linkType === "recovery" || linkType === "invite") && accessToken && refreshToken;

      if (!isTokenLink) {
        if (cancelled) return;
        setError("Geen geldige link gevonden. Vraag een nieuwe uitnodiging of wachtwoord-resetlink aan.");
        setLinkInvalid(true);
        setReady(true);
        return;
      }

      // Kern van de fix: eerst een eventuele bestaande sessie expliciet
      // beëindigen — no-op als er geen sessie was, verwijdert gegarandeerd
      // een conflicterende sessie als die er wel was.
      await supabase.auth.signOut();
      if (cancelled) return;

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled) return;

      if (setSessionError) {
        setError("Kon de link niet verwerken. Vraag een nieuwe link aan.");
        setLinkInvalid(true);
        setReady(true);
        return;
      }

      // Token opruimen uit de zichtbare URL — voorkomt hergebruik bij een
      // refresh en laat geen gevoelige tokens in de adresbalk staan.
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    }

    processUrlToken();
    return () => { cancelled = true; };
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
        ) : linkInvalid ? (
          <>
            <h1 className="login-title">Link ongeldig</h1>
            <p className="login-sub">{error}</p>
          </>
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
