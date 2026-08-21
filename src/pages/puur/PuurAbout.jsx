import React from "react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";

// DEMO CONTENT — later vervangen door echte PUUR-informatie.
const SECTIONS = [
  {
    title: "Ons verhaal",
    text: "PUUR is ontstaan vanuit één overtuiging: content die geen verhaal vertelt, is alleen maar ruis. Wat begon als een klein team met een camera, is uitgegroeid tot een studio die merken helpt om hun eigen verhaal zichtbaar te maken — zonder franje, zonder omwegen.",
  },
  {
    title: "Onze manier van werken",
    text: "Ieder project begint met luisteren, niet met filmen. We willen weten wat een merk wil zeggen, aan wie, en waarom — pas dan pakken we de camera. Zo ontstaat content die klopt, in plaats van content die alleen maar mooi is.",
  },
  {
    title: "Waar we voor staan",
    text: "Geen standaardformats, geen contentkalender om de contentkalender. We geloven in werk dat een merk echt vooruit helpt — ook als dat betekent dat we minder maken, maar beter.",
  },
  {
    title: "Wat we belangrijk vinden",
    text: "Eerlijkheid in het proces, duidelijkheid in de samenwerking, en content die na een jaar nog steeds klopt met wie een merk is.",
  },
];

export default function PuurAbout() {
  usePuurTitle("Wie zijn wij — PUUR");
  return (
    <>
      <section style={{ paddingTop: 64, paddingBottom: 60 }}>
        <PuurContainer>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 20 }}>// DEMO CONTENT — later vervangen door echte PUUR-informatie</div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1, margin: "0 0 24px" }}>
              Wie is PUUR?
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 560 }}>
              Een creatieve studio die content maakt voor merken die meer willen zijn dan nog een feed vol posts.
            </p>
          </PuurReveal>
        </PuurContainer>
      </section>

      <section style={{ paddingBottom: 110 }}>
        <PuurContainer>
          <div style={{ display: "grid", gap: 0 }}>
            {SECTIONS.map((s, i) => (
              <PuurReveal key={s.title} delay={i * 70}>
                <div style={{ borderTop: "1px solid var(--puur-line)", padding: "40px 0", display: "grid", gap: 20 }} className="puur-about-row">
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>{s.title}</h2>
                  <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--puur-ink-soft)", margin: 0, maxWidth: 620 }}>{s.text}</p>
                </div>
              </PuurReveal>
            ))}
          </div>
        </PuurContainer>
      </section>

      <style>{`
        @media (min-width: 780px) { .puur-about-row { grid-template-columns: 240px 1fr !important; align-items: start; } }
      `}</style>
    </>
  );
}
