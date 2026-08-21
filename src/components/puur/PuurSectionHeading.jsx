import React from "react";
import PuurReveal from "./PuurReveal.jsx";

export default function PuurSectionHeading({ eyebrow, title, sub, align = "left" }) {
  const isCenter = align === "center";
  return (
    <PuurReveal>
      <div style={{ textAlign: isCenter ? "center" : "left", maxWidth: isCenter ? 640 : 720, margin: isCenter ? "0 auto" : 0 }}>
        {eyebrow && <div className="puur-eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 4.2vw, 46px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: "var(--puur-ink)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: "var(--puur-ink-soft)", maxWidth: 520, marginLeft: isCenter ? "auto" : 0, marginRight: isCenter ? "auto" : 0 }}>
            {sub}
          </p>
        )}
      </div>
    </PuurReveal>
  );
}
