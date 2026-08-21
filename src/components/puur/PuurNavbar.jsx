import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const LINKS = [
  { to: "/puur", label: "Home" },
  { to: "/puur/over-ons", label: "Wie zijn wij" },
  { to: "/puur/diensten", label: "Diensten" },
  { to: "/puur/werk", label: "Werk" },
  { to: "/puur/contact", label: "Contact" },
];

export default function PuurNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled ? "var(--puur-paper)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--puur-line)" : "1px solid transparent",
          transition: "background .25s, border-color .25s",
        }}
      >
        <div className="puur-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 76 }}>
          <Link to="/puur" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }} aria-label="PUUR — home">
            PUUR
          </Link>

          <nav style={{ display: "none" }} className="puur-nav-desktop" aria-label="Hoofdnavigatie">
            {LINKS.slice(1, -1).map((l) => (
              <Link key={l.to} to={l.to} style={{ fontSize: 14, fontWeight: 500, color: "var(--puur-ink-soft)", marginRight: 32 }}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              to="/puur/contact"
              className="puur-nav-cta"
              style={{ display: "none", fontSize: 13.5, fontWeight: 600, padding: "10px 18px", border: "1px solid var(--puur-ink)", borderRadius: "var(--puur-radius)" }}
            >
              Neem contact op
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Sluit menu" : "Open menu"}
              className="puur-nav-toggle"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--puur-ink)" }}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 49, background: "var(--puur-paper)",
          display: open ? "flex" : "none", flexDirection: "column", justifyContent: "center",
          padding: "0 32px",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 22 }} aria-label="Mobiele navigatie">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .puur-nav-desktop { display: flex !important; align-items: center; }
          .puur-nav-cta { display: inline-flex !important; }
          .puur-nav-toggle { display: none !important; }
        }
      `}</style>
    </>
  );
}
