import React from "react";
import { Outlet } from "react-router-dom";
import PuurNavbar from "./PuurNavbar.jsx";
import PuurFooter from "./PuurFooter.jsx";

/**
 * PUUR — volledig geïsoleerde demo-site voor een fictief creatief
 * contentbureau, gebruikt om VELRIX' mogelijkheden te demonstreren.
 * Deze layout injecteert het PUUR-ontwerptokensysteem PRECIES ÉÉN keer
 * (zelfde patroon als AdminLayout.jsx/DashboardLayout.jsx elders in deze
 * codebase) en overschrijft bewust de globale, donkere VELRIX-achtergrond
 * (src/index.css) binnen deze ene wrapper — geen enkele andere pagina
 * wordt hierdoor geraakt.
 *
 * Kleur/type-tokens gebruiken UITSLUITEND al geladen fonts (Inter, IBM
 * Plex Mono, beide al in index.html sitebreed aanwezig) — geen nieuwe
 * font-aanvraag nodig.
 */
export default function PuurLayout() {
  return (
    <div className="puur-shell">
      <style>{`
        .puur-shell {
          --puur-paper: #EFEAE0;
          --puur-paper-soft: #E7E0D2;
          --puur-ink: #171512;
          --puur-ink-soft: #57534A;
          --puur-accent: #B8272E;
          --puur-line: #DDD6C8;
          --puur-radius: 2px;
          background: var(--puur-paper);
          color: var(--puur-ink);
          min-height: 100vh;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .puur-shell * { box-sizing: border-box; }
        .puur-eyebrow {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 11.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--puur-accent);
        }
        .puur-container { max-width: 1240px; margin: 0 auto; padding: 0 24px; }
        @media (min-width: 768px) { .puur-container { padding: 0 40px; } }
        .puur-shell a { color: inherit; text-decoration: none; }
        .puur-shell :focus-visible {
          outline: 2px solid var(--puur-accent);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .puur-shell * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
      <PuurNavbar />
      <main>
        <Outlet />
      </main>
      <PuurFooter />
    </div>
  );
}
