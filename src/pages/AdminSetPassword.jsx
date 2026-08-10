import React, { useState } from "react";
import { KeyRound, ShieldCheck, Check } from "lucide-react";

// Deliberately not linked from any nav/footer/sitemap — zelfde patroon als
// AdminConnect.jsx. Alleen bereikbaar door de URL zelf te typen, en dan
// nog steeds beveiligd door de ADMIN_SETUP_SECRET-check op de server.
export default function AdminSetPassword() {
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("daniel@velrix.nl");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: "success"|"error", message }

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (password.length < 8) {
      setResult({ type: "error", message: "Wachtwoord moet minimaal 8 tekens zijn." });
      return;
    }
    if (password !== confirm) {
      setResult({ type: "error", message: "De twee wachtwoorden komen niet overeen." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/set-portal-password?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onbekende fout");
      setResult({
        type: "success",
        message: data.action === "created" ? "Account aangemaakt en wachtwoord ingesteld." : "Wachtwoord bijgewerkt.",
      });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0a0b0d", color: "#f3f1ec", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 440, width: "100%", border: "1px solid #24272d", background: "#15171b", borderRadius: 18, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={18} style={{ color: "#c9a668" }} />
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11.5, color: "#9a9c9f", letterSpacing: "0.04em" }}>ALLEEN VOOR VELRIX-BEHEER</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 500, margin: "10px 0 8px" }}>Portaalwachtwoord instellen</h1>
        <p style={{ fontSize: 13.5, color: "#9a9c9f", lineHeight: 1.6, marginBottom: 22 }}>
          Stelt direct een wachtwoord in voor een portal-account, zonder e-mail. Het wachtwoord dat je hieronder typt
          wordt rechtstreeks door Supabase gehasht en opgeslagen — het komt nergens anders terecht.
        </p>

        <form onSubmit={submit}>
          <label style={{ fontSize: 12, color: "#6b6d71", display: "block", marginBottom: 6 }}>Setup-sleutel</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_SETUP_SECRET"
            style={{ width: "100%", background: "#0e1013", border: "1px solid #34383f", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f3f1ec", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 12, color: "#6b6d71", display: "block", marginBottom: 6 }}>E-mailadres</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", background: "#0e1013", border: "1px solid #34383f", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f3f1ec", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 12, color: "#6b6d71", display: "block", marginBottom: 6 }}>Nieuw wachtwoord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            style={{ width: "100%", background: "#0e1013", border: "1px solid #34383f", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f3f1ec", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 12, color: "#6b6d71", display: "block", marginBottom: 6 }}>Herhaal wachtwoord</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            style={{ width: "100%", background: "#0e1013", border: "1px solid #34383f", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#f3f1ec", outline: "none", marginBottom: 18, boxSizing: "border-box" }}
          />

          {result && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 16,
                color: result.type === "success" ? "#6fd18a" : "#e6947a",
                background: result.type === "success" ? "rgba(111,209,138,.08)" : "rgba(230,148,122,.08)",
                border: `1px solid ${result.type === "success" ? "rgba(111,209,138,.3)" : "rgba(230,148,122,.3)"}`,
              }}
            >
              {result.type === "success" && <Check size={14} />}
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!key || !email || !password || loading}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 20px",
              borderRadius: 10,
              border: "none",
              cursor: key && email && password && !loading ? "pointer" : "not-allowed",
              opacity: key && email && password && !loading ? 1 : 0.5,
              background: "linear-gradient(150deg,#e6cd94,#c9a668)",
              color: "#17130a",
              fontWeight: 600,
              fontSize: 14.5,
            }}
          >
            <KeyRound size={16} /> {loading ? "Bezig…" : "Wachtwoord instellen"}
          </button>
        </form>

        <p style={{ fontSize: 11.5, color: "#6b6d71", marginTop: 16, lineHeight: 1.6 }}>
          Werkt voor zowel nieuwe als bestaande accounts — bestaat het e-mailadres nog niet, dan wordt het meteen aangemaakt en bevestigd.
        </p>
      </div>
    </div>
  );
}
