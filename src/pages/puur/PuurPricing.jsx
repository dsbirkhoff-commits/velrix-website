import React from "react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import PuurButton from "../../components/puur/PuurButton.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";

const CATEGORIES = [
  { title: "Content Shoot", text: "Een gerichte fotoshoot of video-opname voor een specifiek doel." },
  { title: "Social Content", text: "Doorlopende content voor social kanalen, afgestemd op een contentkalender." },
  { title: "Complete Content Day", text: "Een volledige dag foto én video, voor merken die in één keer vooruit willen." },
];

export default function PuurPricing() {
  usePuurTitle("Prijzen — PUUR");
  return (
    <section style={{ paddingTop: 64, paddingBottom: 120 }}>
      <PuurContainer>
        <PuurReveal>
          <div className="puur-eyebrow" style={{ marginBottom: 20 }}>Prijzen</div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1, margin: "0 0 24px" }}>
            Content op maat.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 560, marginBottom: 20 }}>
            Geen merk is hetzelfde. Daarom werken we met oplossingen die aansluiten op wat je nodig hebt.
          </p>
        </PuurReveal>

        <div className="puur-pricing-grid" style={{ display: "grid", gap: 0, marginTop: 60 }}>
          {CATEGORIES.map((c, i) => (
            <PuurReveal key={c.title} delay={i * 70}>
              <div style={{ borderTop: "1px solid var(--puur-line)", padding: "32px 0" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{c.title}</h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--puur-ink-soft)", margin: 0, maxWidth: 360 }}>{c.text}</p>
              </div>
            </PuurReveal>
          ))}
          <div style={{ borderTop: "1px solid var(--puur-line)" }} />
        </div>

        <PuurReveal delay={200}>
          <div style={{ marginTop: 60, textAlign: "center", padding: "56px 24px", background: "var(--puur-paper-soft)", borderRadius: "var(--puur-radius)" }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Vraag een voorstel aan</h2>
            <p style={{ fontSize: 14.5, color: "var(--puur-ink-soft)", marginBottom: 26 }}>We denken graag mee over wat past bij jouw merk en budget.</p>
            <PuurButton to="/puur/contact">Neem contact op</PuurButton>
          </div>
        </PuurReveal>
      </PuurContainer>
    </section>
  );
}
