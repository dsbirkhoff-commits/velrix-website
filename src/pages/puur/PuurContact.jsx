import React, { useState } from "react";
import { Check } from "lucide-react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";

const FIELDS = [
  { name: "naam", label: "Naam", type: "text", required: true },
  { name: "bedrijf", label: "Bedrijf", type: "text", required: false },
  { name: "email", label: "E-mail", type: "email", required: true },
  { name: "telefoon", label: "Telefoon", type: "tel", required: false },
];

const inputStyle = {
  width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--puur-line)",
  padding: "12px 0", fontSize: 15, color: "var(--puur-ink)", outline: "none", fontFamily: "inherit",
};

export default function PuurContact() {
  usePuurTitle("Contact — PUUR");
  const [submitted, setSubmitted] = useState(false);

  // Demo-only: er is nog geen backend gekoppeld voor PUUR (bewust, zoals
  // gevraagd — geen echte API bouwen, geen gegevens ergens naartoe sturen).
  // Toont uitsluitend een nette demo-succesmelding na verzenden.
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section style={{ paddingTop: 64, paddingBottom: 120 }}>
      <PuurContainer>
        <div className="puur-contact-grid" style={{ display: "grid", gap: 60 }}>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 20 }}>Contact</div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(38px, 6.5vw, 64px)", lineHeight: 1, margin: "0 0 20px" }}>
              Let's create.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 380, marginBottom: 40 }}>
              Vertel ons wat je in gedachten hebt.
            </p>
            <div className="puur-eyebrow" style={{ marginBottom: 14, color: "var(--puur-ink-soft)" }}>Social</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Instagram", "TikTok", "LinkedIn"].map((s) => (
                <span key={s} style={{ fontSize: 14, color: "var(--puur-ink-soft)" }}>{s} <span style={{ opacity: 0.55 }}>— binnenkort</span></span>
              ))}
            </div>
          </PuurReveal>

          <PuurReveal delay={90}>
            {submitted ? (
              <div style={{ padding: "48px 32px", background: "var(--puur-paper-soft)", borderRadius: "var(--puur-radius)" }}>
                <Check size={22} style={{ color: "var(--puur-accent)", marginBottom: 14 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Aanvraag verstuurd</h2>
                <p style={{ fontSize: 14.5, color: "var(--puur-ink-soft)", margin: 0 }}>
                  Dit is een demo-omgeving — er is nog geen echte verzending gekoppeld. Zodra PUUR live gaat, komt
                  hier een werkend contactformulier.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gap: 22 }} className="puur-form-grid">
                  {FIELDS.map((f) => (
                    <div key={f.name}>
                      <label htmlFor={f.name} style={{ display: "block", fontSize: 12.5, color: "var(--puur-ink-soft)", marginBottom: 8 }}>
                        {f.label}{f.required && " *"}
                      </label>
                      <input id={f.name} name={f.name} type={f.type} required={f.required} style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 22 }}>
                  <label htmlFor="onderwerp" style={{ display: "block", fontSize: 12.5, color: "var(--puur-ink-soft)", marginBottom: 8 }}>
                    Waar kunnen we je mee helpen?
                  </label>
                  <input id="onderwerp" name="onderwerp" type="text" style={inputStyle} />
                </div>
                <div style={{ marginTop: 22 }}>
                  <label htmlFor="bericht" style={{ display: "block", fontSize: 12.5, color: "var(--puur-ink-soft)", marginBottom: 8 }}>
                    Bericht
                  </label>
                  <textarea id="bericht" name="bericht" rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: 32, width: "100%", padding: "15px", background: "var(--puur-ink)", color: "var(--puur-paper)",
                    border: "none", borderRadius: "var(--puur-radius)", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Verstuur aanvraag
                </button>
              </form>
            )}
          </PuurReveal>
        </div>
      </PuurContainer>

      <style>{`
        @media (min-width: 860px) { .puur-contact-grid { grid-template-columns: 1fr 1.3fr !important; } }
        @media (min-width: 480px) { .puur-form-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </section>
  );
}
