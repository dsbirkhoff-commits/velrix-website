import React from "react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import PuurPortfolioCard from "../../components/puur/PuurPortfolioCard.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";
import { PORTFOLIO } from "../../components/puur/puurContent.js";

export default function PuurWork() {
  usePuurTitle("Ons werk — PUUR");
  return (
    <>
      <section style={{ paddingTop: 64, paddingBottom: 56 }}>
        <PuurContainer>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 20 }}>Portfolio</div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1, margin: "0 0 24px" }}>
              Ons werk.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 560 }}>
              Een selectie demo-projecten — later vervangen door echt PUUR-werk.
            </p>
          </PuurReveal>
        </PuurContainer>
      </section>

      <section style={{ paddingBottom: 120 }}>
        <PuurContainer>
          <div className="puur-work-grid-full" style={{ display: "grid", gap: 28, gridTemplateColumns: "1fr" }}>
            {PORTFOLIO.map((p, i) => (
              <PuurPortfolioCard key={p.slug} {...p} delay={i * 50} />
            ))}
          </div>
        </PuurContainer>
      </section>

      <style>{`
        @media (min-width: 700px) { .puur-work-grid-full { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1080px) { .puur-work-grid-full { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>
    </>
  );
}
