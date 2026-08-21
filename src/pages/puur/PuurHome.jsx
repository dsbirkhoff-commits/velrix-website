import React from "react";
import { Camera } from "lucide-react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import PuurSectionHeading from "../../components/puur/PuurSectionHeading.jsx";
import PuurButton from "../../components/puur/PuurButton.jsx";
import PuurServiceCard from "../../components/puur/PuurServiceCard.jsx";
import PuurPortfolioCard from "../../components/puur/PuurPortfolioCard.jsx";
import { SERVICES, PORTFOLIO, PRINCIPLES } from "../../components/puur/puurContent.js";
import usePuurTitle from "../../components/puur/usePuurTitle.js";

export default function PuurHome() {
  usePuurTitle("PUUR — Content die jouw verhaal zichtbaar maakt");
  return (
    <>

      {/* HERO */}
      <section style={{ paddingTop: 64 }}>
        <PuurContainer>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 20 }}>Creatief contentbureau</div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em",
                fontSize: "clamp(44px, 8.5vw, 108px)", lineHeight: 0.98, margin: "0 0 28px",
              }}
            >
              PUUR.<br />
              Content die<br />
              jouw verhaal<br />
              zichtbaar maakt.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 420, marginBottom: 32 }}>
              Foto, video en creatieve content voor merken die gezien willen worden.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <PuurButton to="/puur/werk">Bekijk ons werk</PuurButton>
              <PuurButton to="/puur/contact" variant="outline">Neem contact op</PuurButton>
            </div>
          </PuurReveal>
        </PuurContainer>

        <PuurReveal delay={150}>
          <div
            style={{
              marginTop: 56, width: "100%", aspectRatio: "21 / 9",
              background: "linear-gradient(120deg, #171512 0%, #57534A 45%, #B8272E 100%)",
              position: "relative", overflow: "hidden",
            }}
            role="img"
            aria-label="Sfeerbeeld — demo-visual, later te vervangen door echte fotografie"
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: 28 }}>
              <span className="puur-eyebrow" style={{ color: "var(--puur-paper)", opacity: 0.85 }}>
                <Camera size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
                Demo-visual — later vervangen door echte fotografie
              </span>
            </div>
          </div>
        </PuurReveal>
      </section>

      {/* INTRO */}
      <section style={{ padding: "110px 0 90px" }}>
        <PuurContainer>
          <PuurSectionHeading
            title={<>Wij maken content die niet alleen mooi is, maar iets vertelt.</>}
            sub="Van fotografie tot short-form video — elk stuk content wordt gemaakt met een duidelijk idee erachter, niet als losse uiting."
          />
        </PuurContainer>
      </section>

      {/* DIENSTEN */}
      <section style={{ padding: "0 0 100px" }}>
        <PuurContainer>
          <PuurSectionHeading eyebrow="Diensten" title="Wat we doen" />
          <div style={{ marginTop: 36 }}>
            {SERVICES.map((s, i) => (
              <PuurServiceCard key={s.slug} number={s.number} title={s.title} description={s.short} delay={i * 60} />
            ))}
            <div style={{ borderTop: "1px solid var(--puur-line)" }} />
          </div>
        </PuurContainer>
      </section>

      {/* VISUAL BREAK */}
      <PuurReveal as="section">
        <div
          style={{
            width: "100%", minHeight: "60vh", background: "var(--puur-ink)", color: "var(--puur-paper)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px",
          }}
        >
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(36px, 7vw, 84px)", textAlign: "center", margin: 0 }}>
            BEELD ZEGT MEER.
          </h2>
        </div>
      </PuurReveal>

      {/* WERK */}
      <section style={{ padding: "100px 0" }}>
        <PuurContainer>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
            <PuurSectionHeading eyebrow="Portfolio" title="Ons werk" />
            <PuurButton to="/puur/werk" variant="outline">Alle projecten</PuurButton>
          </div>
          <div className="puur-work-grid" style={{ display: "grid", gap: 28, gridTemplateColumns: "1fr" }}>
            {PORTFOLIO.slice(0, 4).map((p, i) => (
              <PuurPortfolioCard key={p.slug} {...p} delay={i * 70} />
            ))}
          </div>
        </PuurContainer>
      </section>

      {/* WAAROM PUUR */}
      <section style={{ padding: "20px 0 100px" }}>
        <PuurContainer>
          <PuurSectionHeading eyebrow="Waarom PUUR" title="Waarom PUUR?" />
          <div className="puur-principles-grid" style={{ display: "grid", gap: 32, gridTemplateColumns: "1fr", marginTop: 40 }}>
            {PRINCIPLES.map((p, i) => (
              <PuurReveal key={p.number} delay={i * 60}>
                <div className="puur-eyebrow" style={{ marginBottom: 12 }}>{p.number}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{p.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--puur-ink-soft)", margin: 0 }}>{p.text}</p>
              </PuurReveal>
            ))}
          </div>
        </PuurContainer>
      </section>

      {/* OVER PUUR teaser */}
      <section style={{ padding: "0 0 100px" }}>
        <PuurContainer>
          <PuurReveal>
            <div style={{ borderTop: "1px solid var(--puur-line)", borderBottom: "1px solid var(--puur-line)", padding: "56px 0" }}>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4.5vw, 48px)", letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 560 }}>
                Geen ruis.<br />Gewoon goede content.
              </h2>
              <PuurButton to="/puur/over-ons" variant="outline">Meer over PUUR</PuurButton>
            </div>
          </PuurReveal>
        </PuurContainer>
      </section>

      {/* CTA */}
      <section style={{ padding: "40px 0 120px" }}>
        <PuurContainer>
          <PuurReveal>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(30px, 5.5vw, 58px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 14px" }}>
                Jouw merk verdient<br />meer dan standaard content.
              </h2>
              <p style={{ fontSize: 16, color: "var(--puur-ink-soft)", marginBottom: 32 }}>Let's create something.</p>
              <PuurButton to="/puur/contact">Neem contact op</PuurButton>
            </div>
          </PuurReveal>
        </PuurContainer>
      </section>

      <style>{`
        @media (min-width: 700px) { .puur-work-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 640px) { .puur-principles-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .puur-principles-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </>
  );
}
