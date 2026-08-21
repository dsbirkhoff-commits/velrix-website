import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import PuurReveal from "./PuurReveal.jsx";

export default function PuurServiceCard({ number, title, description, delay = 0 }) {
  const [hover, setHover] = useState(false);
  return (
    <PuurReveal delay={delay}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "flex-start", gap: 24,
          padding: "28px 4px", borderTop: "1px solid var(--puur-line)",
          transform: hover ? "translateX(6px)" : "translateX(0)",
          transition: "transform .3s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <span className="puur-eyebrow" style={{ paddingTop: 4, minWidth: 34 }}>{number}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 8px" }}>{title}</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--puur-ink-soft)", margin: 0, maxWidth: 480 }}>{description}</p>
        </div>
        <ArrowUpRight size={18} style={{ opacity: hover ? 1 : 0.25, transition: "opacity .25s", flexShrink: 0, marginTop: 4 }} />
      </div>
    </PuurReveal>
  );
}
