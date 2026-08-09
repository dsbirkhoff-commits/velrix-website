import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Gauge, Menu } from "lucide-react";
import { useBooking } from "./BookingProvider.jsx";

const SECTION_LINKS = [
  { hash: "#diensten", label: "Diensten" },
  { hash: "#waarom-wij", label: "Waarom wij" },
  { hash: "#prijzen", label: "Prijzen" },
  { hash: "#faq", label: "FAQ" },
];

export default function SiteNav() {
  const { openBooking } = useBooking();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section links only make sense on the homepage. From any other page,
  // navigate to "/" + hash; Home.jsx scrolls to the hash once it mounts.
  const goToSection = (hash) => {
    setOpen(false);
    if (location.pathname === "/") {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/${hash}`);
    }
  };

  const goHome = (e) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <header className={`nav-wrap ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-[72px]">
        <a href="/" onClick={goHome} className="flex items-center gap-2.5">
          <span className="brand-mark"><Gauge size={16} strokeWidth={2} /></span>
          <span className="brand-word">VELRIX</span>
          <span className="brand-suffix">Reception</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {SECTION_LINKS.map((l) => (
            <a key={l.hash} href={`/${l.hash}`} onClick={(e) => { e.preventDefault(); goToSection(l.hash); }} className="nav-link">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="nav-link">Live demo</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        <div className="hidden md:block">
          <button onClick={openBooking} className="btn-gold-sm">Plan een gesprek</button>
        </div>

        <button className="md:hidden text-[var(--text)] p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="md:hidden mobile-menu">
          {SECTION_LINKS.map((l) => (
            <a key={l.hash} href={`/${l.hash}`} onClick={(e) => { e.preventDefault(); goToSection(l.hash); }} className="mobile-link">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="mobile-link" onClick={() => setOpen(false)}>Live demo</Link>
          <Link to="/contact" className="mobile-link" onClick={() => setOpen(false)}>Contact</Link>
          <button onClick={() => { setOpen(false); openBooking(); }} className="btn-gold-sm w-full justify-center mt-2">
            Plan een gesprek
          </button>
        </div>
      )}
    </header>
  );
}
