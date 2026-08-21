import React, { useState } from "react";
import { Link } from "react-router-dom";
import PuurReveal from "./PuurReveal.jsx";

const Corner = ({ style }) => (
  <span
    aria-hidden="true"
    style={{
      position: "absolute", width: 22, height: 22, borderColor: "var(--puur-paper)",
      ...style,
    }}
  />
);

/**
 * gradientIndex kiest een van vier vaste, abstracte duotone-composities
 * (geen externe afbeeldingen — CSS-only placeholder-beeld, bewust
 * gevarieerd zodat het grid niet uniform/nep aanvoelt).
 */
const GRADIENTS = [
  "linear-gradient(135deg, #171512 0%, #57534A 55%, #B8272E 100%)",
  "linear-gradient(150deg, #B8272E 0%, #171512 70%)",
  "linear-gradient(160deg, #57534A 0%, #171512 60%, #B8272E 130%)",
  "linear-gradient(140deg, #171512 0%, #B8272E 45%, #57534A 100%)",
];

export default function PuurPortfolioCard({ slug, title, category, gradientIndex = 0, delay = 0, tall = false }) {
  const [hover, setHover] = useState(false);
  return (
    <PuurReveal delay={delay} className="puur-portfolio-card">
      <Link
        to={`/puur/werk/${slug}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ display: "block" }}
        aria-label={`${title} — bekijk demo-project`}
      >
        <div
          style={{
            position: "relative", width: "100%", aspectRatio: tall ? "3 / 4" : "4 / 3",
            background: GRADIENTS[gradientIndex % GRADIENTS.length],
            overflow: "hidden", borderRadius: "var(--puur-radius)",
          }}
        >
          <span style={{ position: "absolute", inset: 0, transform: hover ? "scale(1.045)" : "scale(1)", transition: "transform .6s cubic-bezier(.16,1,.3,1)", background: "inherit" }} />
          {/* Viewfinder-signatuurelement: dunne cornerbrackets, alleen bij hover — nooit overal herhaald */}
          <Corner style={{ top: 14, left: 14, borderTop: "2px solid", borderLeft: "2px solid", opacity: hover ? 1 : 0, transition: "opacity .3s" }} />
          <Corner style={{ top: 14, right: 14, borderTop: "2px solid", borderRight: "2px solid", opacity: hover ? 1 : 0, transition: "opacity .3s .05s" }} />
          <Corner style={{ bottom: 14, left: 14, borderBottom: "2px solid", borderLeft: "2px solid", opacity: hover ? 1 : 0, transition: "opacity .3s .1s" }} />
          <Corner style={{ bottom: 14, right: 14, borderBottom: "2px solid", borderRight: "2px solid", opacity: hover ? 1 : 0, transition: "opacity .3s .15s" }} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</span>
          <span className="puur-eyebrow" style={{ color: "var(--puur-ink-soft)" }}>{category}</span>
        </div>
      </Link>
    </PuurReveal>
  );
}
