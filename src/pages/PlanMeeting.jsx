import React, { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import SiteNav from "../components/SiteNav.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { useBooking } from "../components/BookingProvider.jsx";

export default function PlanMeeting() {
  const { openBooking } = useBooking();
  const [autoOpened, setAutoOpened] = useState(false);

  // Direct link (e.g. from an email signature) should drop the visitor
  // straight into the booking flow.
  useEffect(() => {
    if (!autoOpened) {
      openBooking();
      setAutoOpened(true);
    }
  }, [autoOpened, openBooking]);

  return (
    <div className="legal-page">
      <style>{`
        .legal-page { --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          background: var(--ink); color: var(--text); min-height:100vh; font-family:'Inter',ui-sans-serif,system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
        .legal-page h1 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .plan-hero { max-width: 620px; margin: 0 auto; padding: 120px 20px 100px; text-align:center; }
        .plan-hero h1 { font-size: clamp(2rem, 4vw, 2.8rem); font-weight:500; }
        .plan-hero p { margin-top:16px; font-size:16.5px; line-height:1.65; color: var(--text-muted); }
        .btn-gold { display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border-radius:10px; border:none; cursor:pointer;
          background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:15px; margin-top:32px; transition: transform .2s ease, filter .2s; }
        .btn-gold:hover { transform: translateY(-2px); filter: brightness(1.05); }
      `}</style>
      <SiteNav />
      <main>
        <section className="plan-hero">
          <h1>Plan een gratis kennismaking</h1>
          <p>30 minuten om te bespreken hoe VELRIX AI en automatisering voor jouw bedrijf kan inzetten.</p>
          <button className="btn-gold" onClick={openBooking}><CalendarClock size={17} /> Plan een gesprek</button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
