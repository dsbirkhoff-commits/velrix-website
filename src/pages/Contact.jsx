import React from "react";
import { Mail, ArrowRight } from "lucide-react";
import SiteNav from "../components/SiteNav.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useBooking } from "../components/BookingProvider.jsx";

export default function Contact() {
  const { openBooking } = useBooking();
  return (
    <div className="legal-page">
      <style>{`
        .legal-page { --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          background: var(--ink); color: var(--text); min-height:100vh; font-family:'Inter',ui-sans-serif,system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
        .legal-page h1, .legal-page h2 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .contact-hero { max-width: 640px; margin: 0 auto; padding: 120px 20px 100px; text-align:center; }
        .contact-hero h1 { font-size: clamp(2rem, 4vw, 2.8rem); font-weight:500; }
        .contact-hero p { margin-top:16px; font-size:16.5px; line-height:1.65; color: var(--text-muted); }
        .contact-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:14px; margin-top:36px; }
        .btn-gold { display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border-radius:10px; border:none; cursor:pointer;
          background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:15px; transition: transform .2s ease, filter .2s; }
        .btn-gold:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; padding:14px 24px; border-radius:10px; border:1px solid var(--border-strong); color: var(--text); font-weight:500; font-size:15px; text-decoration:none; background: rgba(255,255,255,.02); }
        .btn-ghost:hover { border-color: var(--gold-dim); background: rgba(201,166,104,.06); }
      `}</style>
      <SiteNav />
      <main>
        <section className="contact-hero">
          <h1>Neem contact op</h1>
          <p>Benieuwd wat VELRIX voor jouw bedrijf kan betekenen? Stuur ons een e-mail of plan direct een kennismaking.</p>
          <div className="contact-actions">
            <button className="btn-gold" onClick={openBooking}>Plan een gesprek <ArrowRight size={16} /></button>
            <a className="btn-ghost" href="mailto:daniel@velrix.nl"><Mail size={16} /> daniel@velrix.nl</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
