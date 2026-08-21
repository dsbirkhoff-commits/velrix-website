import React from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { to: "/puur", label: "Home" },
  { to: "/puur/over-ons", label: "Wie zijn wij" },
  { to: "/puur/diensten", label: "Diensten" },
  { to: "/puur/werk", label: "Werk" },
  { to: "/puur/contact", label: "Contact" },
];

// Nog geen echte social-accounts — bewust géén link (href="#"), zodat dit
// nooit per ongeluk als een werkende, definitieve URL wordt gebruikt.
const SOCIALS = ["Instagram", "TikTok", "LinkedIn"];

export default function PuurFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--puur-line)", marginTop: 40 }}>
      <div className="puur-container" style={{ padding: "56px 24px 40px", display: "grid", gap: 40, gridTemplateColumns: "1fr" }}>
        <div style={{ display: "grid", gap: 40, gridTemplateColumns: "1fr" }} className="puur-footer-grid">
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 10 }}>PUUR</div>
            <p style={{ fontSize: 14, color: "var(--puur-ink-soft)", maxWidth: 280, lineHeight: 1.6 }}>
              Content die jouw verhaal zichtbaar maakt.
            </p>
          </div>
          <div>
            <div className="puur-eyebrow" style={{ marginBottom: 14 }}>Navigatie</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} style={{ fontSize: 14, color: "var(--puur-ink-soft)" }}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="puur-eyebrow" style={{ marginBottom: 14 }}>Social</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SOCIALS.map((s) => (
                <span key={s} style={{ fontSize: 14, color: "var(--puur-ink-soft)" }}>{s} <span style={{ opacity: 0.55 }}>— binnenkort</span></span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--puur-line)", paddingTop: 20, fontSize: 12.5, color: "var(--puur-ink-soft)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>© {new Date().getFullYear()} PUUR — demo-omgeving, gemaakt met VELRIX</span>
          <span className="puur-eyebrow" style={{ color: "var(--puur-ink-soft)" }}>Nog geen definitieve bedrijfsgegevens ingevuld</span>
        </div>
      </div>
      <style>{`
        @media (min-width: 720px) {
          .puur-footer-grid { grid-template-columns: 1.4fr 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
