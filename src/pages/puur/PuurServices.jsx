import React from "react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import PuurButton from "../../components/puur/PuurButton.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";
import { SERVICES } from "../../components/puur/puurContent.js";

const GRADIENTS = [
  "linear-gradient(135deg, #171512 0%, #57534A 55%, #B8272E 100%)",
  "linear-gradient(150deg, #B8272E 0%, #171512 70%)",
  "linear-gradient(160deg, #57534A 0%, #171512 60%, #B8272E 130%)",
  "linear-gradient(140deg, #171512 0%, #B8272E 45%, #57534A 100%)",
];

export default function PuurServices() {
  usePuurTitle("Diensten — PUUR");
  return (
    <>
      <section style={{ paddingTop: 64, paddingBottom: 60 }}>
        <PuurContainer>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 20 }}>Diensten</div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1, margin: "0 0 24px" }}>
              Wat we doen.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 560 }}>
              Vier disciplines, één doel: content die een merk daadwerkelijk zichtbaar maakt.
            </p>
          </PuurReveal>
        </PuurContainer>
      </section>

      {SERVICES.map((s, i) => (
        <section key={s.slug} style={{ padding: "80px 0", borderTop: "1px solid var(--puur-line)" }}>
          <PuurContainer>
            <div className="puur-service-detail" style={{ display: "grid", gap: 40 }}>
              <PuurReveal>
                <div
                  style={{ width: "100%", aspectRatio: "4 / 3", background: GRADIENTS[i % GRADIENTS.length], borderRadius: "var(--puur-radius)" }}
                  role="img"
                  aria-label={`Demo-visual voor ${s.title}`}
                />
              </PuurReveal>
              <PuurReveal delay={90}>
                <div className="puur-eyebrow" style={{ marginBottom: 16 }}>{s.number}</div>
                <h2 style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px" }}>{s.title}</h2>
                <p style={{ fontSize: 17, fontWeight: 500, color: "var(--puur-ink)", marginBottom: 20 }}>{s.intro}</p>
                <div className="puur-eyebrow" style={{ marginBottom: 12, color: "var(--puur-ink-soft)" }}>Mogelijke deliverables</div>
                <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.deliverables.map((d) => (
                    <li key={d} style={{ fontSize: 14.5, color: "var(--puur-ink-soft)", paddingLeft: 18, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "var(--puur-accent)" }}>—</span>
                      {d}
                    </li>
                  ))}
                </ul>
                <PuurButton to="/puur/contact" variant="outline">Vraag een voorstel aan</PuurButton>
              </PuurReveal>
            </div>
          </PuurContainer>
        </section>
      ))}

      <style>{`
        @media (min-width: 860px) { .puur-service-detail { grid-template-columns: 1fr 1fr !important; align-items: center; } }
      `}</style>
    </>
  );
}
