import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PuurContainer from "../../components/puur/PuurContainer.jsx";
import PuurReveal from "../../components/puur/PuurReveal.jsx";
import PuurButton from "../../components/puur/PuurButton.jsx";
import usePuurTitle from "../../components/puur/usePuurTitle.js";
import { PORTFOLIO } from "../../components/puur/puurContent.js";

const GRADIENTS = [
  "linear-gradient(135deg, #171512 0%, #57534A 55%, #B8272E 100%)",
  "linear-gradient(150deg, #B8272E 0%, #171512 70%)",
  "linear-gradient(160deg, #57534A 0%, #171512 60%, #B8272E 130%)",
  "linear-gradient(140deg, #171512 0%, #B8272E 45%, #57534A 100%)",
];

export default function PuurWorkDetail() {
  const { slug } = useParams();
  const project = PORTFOLIO.find((p) => p.slug === slug);
  usePuurTitle(project ? `${project.title} — PUUR` : "Project niet gevonden — PUUR");

  if (!project) return <Navigate to="/puur/werk" replace />;

  return (
    <>
      <section style={{ paddingTop: 48, paddingBottom: 40 }}>
        <PuurContainer>
          <Link to="/puur/werk" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--puur-ink-soft)", marginBottom: 28 }}>
            <ArrowLeft size={14} /> Alle projecten
          </Link>
          <PuurReveal>
            <div className="puur-eyebrow" style={{ marginBottom: 16 }}>{project.category}</div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.03em", fontSize: "clamp(34px, 6vw, 64px)", margin: 0 }}>
              {project.title}
            </h1>
          </PuurReveal>
        </PuurContainer>
      </section>

      <PuurReveal delay={80} as="section">
        <div
          style={{ width: "100%", aspectRatio: "16 / 9", background: GRADIENTS[project.gradientIndex % GRADIENTS.length] }}
          role="img"
          aria-label={`Demo-visual voor ${project.title}`}
        />
      </PuurReveal>

      <section style={{ padding: "72px 0 120px" }}>
        <PuurContainer>
          <div className="puur-project-detail" style={{ display: "grid", gap: 40 }}>
            <PuurReveal>
              <div className="puur-eyebrow" style={{ marginBottom: 12, color: "var(--puur-ink-soft)" }}>Over dit project</div>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--puur-ink-soft)", margin: 0, maxWidth: 560 }}>
                Dit is een demo-project ter illustratie van hoe een projectpagina er in de PUUR-portfolio uit kan
                zien. Zodra er echt PUUR-werk beschikbaar is, wordt deze content vervangen door de daadwerkelijke
                projectbeschrijving, beeldmateriaal en resultaten.
              </p>
            </PuurReveal>
            <PuurReveal delay={70}>
              <div className="puur-eyebrow" style={{ marginBottom: 12, color: "var(--puur-ink-soft)" }}>Disciplines</div>
              <p style={{ fontSize: 14.5, color: "var(--puur-ink-soft)", margin: "0 0 28px" }}>Fotografie · Videografie</p>
              <PuurButton to="/puur/contact" variant="outline">Bespreek een vergelijkbaar project</PuurButton>
            </PuurReveal>
          </div>
        </PuurContainer>
      </section>

      <style>{`
        @media (min-width: 780px) { .puur-project-detail { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </>
  );
}
