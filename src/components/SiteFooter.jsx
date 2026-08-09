import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Gauge, Check, Linkedin, Instagram, Twitter, Youtube, Mail } from "lucide-react";

const SECTION_LINKS = [
  { hash: "#diensten", label: "Diensten" },
  { hash: "#waarom-wij", label: "Waarom wij" },
  { hash: "#prijzen", label: "Prijzen" },
  { hash: "#faq", label: "FAQ" },
];

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (hash) => (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/${hash}`);
    }
  };

  const socials = [
    { icon: Linkedin, label: "LinkedIn" },
    { icon: Instagram, label: "Instagram" },
    { icon: Twitter, label: "X" },
    { icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="footer-newsletter glass-card">
          <div>
            <h3 className="guarantee-title">Blijf op de hoogte</h3>
            <p className="guarantee-desc mt-1">Praktische AI-inzichten voor autogarages.</p>
          </div>
          {subscribed ? (
            <div className="footer-subscribed"><Check size={16} /> Bedankt voor uw aanmelding</div>
          ) : (
            <form className="footer-form" onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}>
              <label htmlFor="newsletter" className="sr-only">E-mailadres voor nieuwsbrief</label>
              <input id="newsletter" type="email" required placeholder="naam@garage.nl" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit">Aanmelden</button>
            </form>
          )}
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 mt-16">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="brand-mark"><Gauge size={16} strokeWidth={2} /></span>
              <span className="brand-word">VELRIX</span>
            </div>
            <p className="footer-desc">Intelligent systems for business.</p>
            <div className="footer-socials">
              {socials.map((s) => (<a key={s.label} href="#" className="footer-social" aria-label={s.label}><s.icon size={16} strokeWidth={1.75} /></a>))}
            </div>
          </div>
          <div>
            <h4 className="footer-heading">Diensten</h4>
            <ul className="footer-list">
              <li><a href="/#diensten" onClick={goToSection("#diensten")}>Digitale receptionist</a></li>
              <li><a href="/#diensten" onClick={goToSection("#diensten")}>24/7 klantenservice</a></li>
              <li><a href="/#diensten" onClick={goToSection("#diensten")}>Werkplaats automatisering</a></li>
              <li><a href="/#diensten" onClick={goToSection("#diensten")}>Garage-website</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Bedrijf</h4>
            <ul className="footer-list">
              <li><Link to="/demo">Demo</Link></li>
              <li><a href="/#prijzen" onClick={goToSection("#prijzen")}>Prijzen</a></li>
              <li><a href="/#faq" onClick={goToSection("#faq")}>Veelgestelde vragen</a></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-list">
              <li><a href="mailto:daniel@velrix.nl" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Mail size={14} /> daniel@velrix.nl</a></li>
            </ul>
            <h4 className="footer-heading" style={{ marginTop: 22 }}>Juridisch</h4>
            <ul className="footer-list">
              <li><Link to="/algemene-voorwaarden">Algemene voorwaarden</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} VELRIX. Alle rechten voorbehouden.</span>
          <div className="flex gap-6">
            <Link to="/privacy">Privacy</Link>
            <Link to="/algemene-voorwaarden">Algemene voorwaarden</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
