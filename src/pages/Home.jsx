import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BookingProvider, useBooking } from "../components/BookingProvider.jsx";
import {
  Gauge,
  PhoneCall,
  MessageSquare,
  Workflow,
  Globe,
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  Menu,
  Mail,
  Clock,
  ChevronDown,
  Sparkles,
  Search,
  Hammer,
  FlaskConical,
  Rocket,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Users,
  Languages,
  Cpu,
  CalendarClock,
  Loader2,
  Mic,
} from "lucide-react";

/* ---------- Reveal on scroll ---------- */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(18px)",
        transition: `opacity 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useMouseGlow(rootRef) {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = null;
    const handle = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
        raf = null;
      });
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, [rootRef]);
}

/* ---------- Nav ---------- */
function Nav() {
  const { openBooking } = useBooking();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = [
    { href: "#diensten", label: "Diensten" },
    { href: "#waarom-wij", label: "Waarom wij" },
    { href: "#prijzen", label: "Prijzen" },
    { href: "#faq", label: "FAQ" },
  ];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <header className={`nav-wrap ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-[72px]">
        <a href="#home" onClick={(e) => { e.preventDefault(); go("#home"); }} className="flex items-center gap-2.5">
          <span className="brand-mark"><Gauge size={16} strokeWidth={2} /></span>
          <span className="brand-word">VELRIX</span>
          <span className="brand-suffix">Reception</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); go(l.href); }} className="nav-link">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="nav-link">Live demo</Link>
          <Link to="/voice-demo" className="nav-link">Voice AI</Link>
        </nav>
        <div className="hidden md:block">
          <button onClick={openBooking} className="btn-gold-sm">
            Plan een gesprek
          </button>
        </div>
        <button className="md:hidden text-[var(--text)] p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="md:hidden mobile-menu">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); go(l.href); }} className="mobile-link">
              {l.label}
            </a>
          ))}
          <Link to="/demo" className="mobile-link">Live demo</Link>
          <Link to="/voice-demo" className="mobile-link">Voice AI</Link>
          <button onClick={() => { setOpen(false); openBooking(); }} className="btn-gold-sm w-full justify-center mt-2">
            Plan een gesprek
          </button>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function DashboardMockup() {
  const bars = [38, 62, 44, 78, 55, 90, 68];
  return (
    <div className="dash-card glass-card" role="img" aria-label="Voorbeeld van het VELRIX Reception-dashboard">
      <div className="dash-topbar">
        <div className="dash-dots"><span /><span /><span /></div>
        <span className="dash-title">VELRIX — Overzicht</span>
      </div>
      <div className="dash-body">
        <div className="dash-nav">
          <span className="dash-nav-dot active" /><span className="dash-nav-dot" /><span className="dash-nav-dot" /><span className="dash-nav-dot" />
        </div>
        <div className="dash-main">
          <div className="dash-tiles">
            <div className="dash-tile"><span className="dash-tile-label">Actieve gesprekken</span><span className="dash-tile-value">6</span></div>
            <div className="dash-tile"><span className="dash-tile-label">Gem. reactietijd</span><span className="dash-tile-value">2s</span></div>
          </div>
          <div className="dash-chart" aria-hidden="true">
            {bars.map((h, i) => (
              <span key={i} className="dash-bar" style={{ "--h": `${h}%`, "--d": `${i * 70}ms` }} />
            ))}
          </div>
          <span className="dash-caption">Voorbeeldweergave — illustratief</span>
        </div>
      </div>
    </div>
  );
}

function ChatbotPreview() {
  const [step, setStep] = useState(0);
  const messages = [
    { from: "bot", text: "Goedemiddag! Waar kan ik u mee helpen?" },
    { from: "user", text: "Zijn jullie morgen open?" },
    { from: "bot", text: "Zeker, we zijn open van 9:00 tot 18:00. Zal ik een afspraak inplannen?" },
  ];
  useEffect(() => {
    if (step >= messages.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1400 + step * 350);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="chat-float glass-card" role="img" aria-label="Voorbeeld van een VELRIX-chatbotgesprek">
      <div className="chat-float-header"><span className="chat-online-dot" /><span>AI Assistent — Online</span></div>
      <div className="chat-float-body">
        {messages.slice(0, step).map((m, i) => (
          <div key={i} className={`chat-bubble ${m.from === "bot" ? "chat-bubble-bot" : "chat-bubble-user"}`}>{m.text}</div>
        ))}
        {step < messages.length && (
          <div className="chat-bubble chat-bubble-bot chat-typing"><span /><span /><span /></div>
        )}
      </div>
    </div>
  );
}

function Hero() {
  const { openBooking } = useBooking();
  const orb1 = useRef(null);
  const orb2 = useRef(null);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        if (orb1.current) orb1.current.style.transform = `translateY(${window.scrollY * 0.08}px)`;
        if (orb2.current) orb2.current.style.transform = `translateY(${window.scrollY * -0.06}px)`;
        raf = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const trustPills = [
    { icon: Check, label: "24/7 bereikbaar" },
    { icon: Languages, label: "Spreekt Nederlands" },
    { icon: CalendarClock, label: "Plant afspraken" },
    { icon: Cpu, label: "Koppelt met agenda" },
  ];

  return (
    <section id="home" className="hero-section">
      <div className="hero-mesh" aria-hidden="true" />
      <div ref={orb1} className="hero-orb hero-orb-1" aria-hidden="true" />
      <div ref={orb2} className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-20 relative">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div>
            <Reveal>
              <div className="eyebrow mb-7"><Sparkles size={13} /> AI-receptionist voor autogarages</div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="hero-title">
                Mis nooit meer<br /><span className="hero-title-accent">een klant</span> die belt.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="hero-sub">
                VELRIX Reception beantwoordt telefoontjes, verzamelt klantgegevens en plant afspraken —
                dag en nacht, in vloeiend Nederlands.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-10">
                <button onClick={openBooking} className="btn-gold btn-gold-lg group">
                  <span className="btn-gold-glow" aria-hidden="true" />
                  Plan een gesprek
                  <ArrowRight size={17} className="btn-arrow" />
                </button>
                <Link to="/demo" className="btn-ghost">Bekijk de live demo</Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="hero-trust-pills">
                {trustPills.map((t) => (
                  <span className="hero-trust-pill" key={t.label}><t.icon size={13} strokeWidth={2} /> {t.label}</span>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={200} className="hero-mockup-wrap">
            <div className="hero-mockup-stage">
              <DashboardMockup />
              <div className="chat-float-position"><ChatbotPreview /></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Trust band ---------- */
function TrustBand() {
  const items = [
    { icon: Cpu, label: "Gebouwd met de nieuwste AI-technologie" },
    { icon: Users, label: "Persoonlijke implementatie" },
    { icon: Languages, label: "Nederlandstalige support" },
  ];
  return (
    <section className="proof-band">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <Reveal>
          <div className="proof-grid">
            {items.map((it) => (
              <div className="proof-item" key={it.label}>
                <div className="proof-icon"><it.icon size={18} strokeWidth={1.75} /></div>
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, sub, align = "left" }) {
  return (
    <Reveal>
      <div className={`section-heading ${align === "center" ? "text-center mx-auto" : ""}`}>
        <span className="eyebrow-mono">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
    </Reveal>
  );
}

/* ---------- Services ---------- */
function ServiceCard({ service, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={index * 90}>
      <div className="service-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className="service-card-glow" style={{ opacity: hovered ? 1 : 0 }} aria-hidden="true" />
        <div className="service-icon"><service.icon size={20} strokeWidth={1.75} /></div>
        <h3 className="service-title">{service.title}</h3>
        <p className="service-desc">{service.desc}</p>
        <ul className="service-points">
          {service.points.map((p) => (<li key={p}><Check size={14} strokeWidth={2.5} />{p}</li>))}
        </ul>
        <a href="#contact" className="service-cta">Meer over {service.title}<ArrowUpRight size={15} /></a>
      </div>
    </Reveal>
  );
}

function Services() {
  const services = [
    { icon: PhoneCall, title: "Digitale receptionist", desc: "VELRIX neemt telefoontjes op, beantwoordt vragen over APK en onderhoud, en plant afspraken direct in uw agenda — ook buiten werktijd.", points: ["Neemt op binnen enkele seconden", "Plant afspraken automatisch in", "Spreekt vloeiend Nederlands"] },
    { icon: MessageSquare, title: "24/7 klantenservice", desc: "Een chatbot op uw website die vragen over prijzen, openingstijden en beschikbaarheid beantwoordt — dag en nacht, in uw eigen toon.", points: ["Getraind op uw eigen garage", "Naadloze overdracht naar de werkplaats", "Legt aanvragen automatisch vast"] },
    { icon: Workflow, title: "Werkplaats automatisering", desc: "Wij koppelen uw agenda, facturatie en onderdelenbeheer zodat terugkerend werk zichzelf afhandelt.", points: ["Koppelt uw bestaande garagesoftware", "Minder handmatige administratie", "Volledig op maat gebouwd"] },
    { icon: Globe, title: "Garage-website", desc: "Een snelle website waar klanten eenvoudig een offerte aanvragen, een afspraak boeken of uw occasions bekijken.", points: ["Offerte- en afsprakenformulier ingebouwd", "Razendsnel en SEO-solide", "Zelf content bijwerken met AI"] },
  ];
  return (
    <section id="diensten" className="section section-alt">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Diensten" title="Vier manieren om AI voor uw garage te laten werken" sub="Los toepasbaar of samen als één systeem." />
        <div className="grid md:grid-cols-2 gap-5 mt-14">
          {services.map((s, i) => (<ServiceCard service={s} index={i} key={s.title} />))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Process ---------- */
function ProcessTimeline() {
  const steps = [
    { icon: Search, title: "Analyse", desc: "We brengen uw telefoonverkeer, drukte en werkplaatsplanning in kaart." },
    { icon: Hammer, title: "Bouw", desc: "We bouwen de receptionist en koppelen uw agenda en systemen." },
    { icon: FlaskConical, title: "Test", desc: "Testen met echte belscenario's — APK, onderhoud, offerte." },
    { icon: Rocket, title: "Live", desc: "Rustige livegang, met begeleiding in de eerste weken." },
  ];
  const trackRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <section className="section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Ons proces" title="Van eerste gesprek tot live systeem" align="center" />
        <div className="process-track" ref={trackRef}>
          <div className="process-line"><div className="process-line-fill" style={{ width: visible ? "100%" : "0%" }} /></div>
          <div className="process-steps">
            {steps.map((s, i) => (
              <Reveal delay={i * 120} key={s.title} className="process-step">
                <div className="process-node"><s.icon size={18} strokeWidth={1.75} /></div>
                <span className="process-num">0{i + 1}</span>
                <h3 className="process-title">{s.title}</h3>
                <p className="process-desc">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Why us + comparison ---------- */
function WhyUs() {
  const rows = [
    { label: "Reactietijd op klantvragen", them: "Binnen kantooruren", us: "Dag en nacht actief" },
    { label: "Implementatie", them: "Losse projecten, weinig samenhang", us: "Eén doorlopend systeem" },
    { label: "Techniek", them: "Vaste sjablonen", us: "Nieuwste AI-modellen, continu bijgewerkt" },
    { label: "Aanspreekpunt", them: "Wisselt per project", us: "Eén vast aanspreekpunt" },
    { label: "Toon & taal", them: "Generieke scripts", us: "Getraind op uw eigen garage" },
    { label: "Contractvorm", them: "Langlopend contract", us: "Maandelijks opzegbaar" },
  ];
  return (
    <section id="waarom-wij" className="section section-alt">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-16 items-start">
          <Reveal>
            <div>
              <span className="eyebrow-mono">Waarom wij</span>
              <h2 className="section-title mt-4">De AI-afdeling die de meeste garages niet kunnen aannemen.</h2>
              <p className="section-sub mt-5">
                VELRIX is opgericht vanuit een simpele observatie: grote AI-doorbraken landen bij techbedrijven,
                terwijl de garage om de hoek er weinig van merkt. Wij vertalen dezelfde technologie naar iets
                dat op een doordeweekse dinsdag daadwerkelijk werkt.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="compare-card">
              <div className="compare-head">
                <span className="compare-head-cell compare-head-them">Traditioneel bureau</span>
                <span className="compare-head-cell compare-head-us"><Gauge size={13} /> VELRIX</span>
              </div>
              {rows.map((r) => (
                <div className="compare-row" key={r.label}>
                  <span className="compare-label">{r.label}</span>
                  <span className="compare-cell compare-cell-them"><X size={14} strokeWidth={2.25} />{r.them}</span>
                  <span className="compare-cell compare-cell-us"><Check size={14} strokeWidth={2.5} />{r.us}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Guarantees (replaces reviews — no fake testimonials) ---------- */
function Guarantees() {
  const items = [
    { title: "Nederlandstalige support", desc: "Altijd in gewone taal, geen technisch jargon." },
    { title: "Persoonlijke implementatie", desc: "Geen kant-en-klaar sjabloon — gebouwd op uw garage." },
    { title: "Maandelijks opzegbaar", desc: "Geen lange contracten of verborgen voorwaarden." },
    { title: "Volledige controle", desc: "U bepaalt wat de AI wel en niet mag zeggen." },
  ];
  return (
    <section className="section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Onze garanties" title="Waar u op kunt rekenen" align="center" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {items.map((it, i) => (
            <Reveal delay={i * 90} key={it.title}>
              <div className="guarantee-card">
                <div className="guarantee-icon"><Check size={16} strokeWidth={2.5} /></div>
                <h3 className="guarantee-title">{it.title}</h3>
                <p className="guarantee-desc">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Case study placeholder ---------- */
function CaseStudy() {
  return (
    <section className="section section-alt">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <Reveal>
          <div className="case-card">
            <span className="case-badge">Binnenkort</span>
            <h2 className="section-title">Eerste klantcase volgt binnenkort.</h2>
            <p className="section-sub mt-4 mx-auto" style={{ maxWidth: "48ch" }}>
              VELRIX werkt op dit moment aan de eerste implementaties bij autogarages. Zodra de eerste
              resultaten binnen zijn, delen we die hier — met echte cijfers, geen voorbeelden.
            </p>
            <a href="#contact" className="btn-ghost mt-6">Wees een van de eersten<ArrowRight size={16} /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- AI Scan ---------- */
function ScanSection() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState("idle"); // idle | scanning | done
  const submit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setState("scanning");
    setTimeout(() => setState("done"), 1500);
  };
  const missing = ["Mist chatbot", "Mist afspraakautomatisering", "Mist WhatsApp-integratie", "Mist SEO-kansen"];
  return (
    <section id="scan" className="section">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
        <SectionHeading eyebrow="Gratis AI-scan" title="Ontdek binnen 60 seconden hoeveel tijd uw garage kan besparen." align="center" />
        <Reveal delay={100}>
          <form onSubmit={submit} className="scan-form">
            <input
              className="scan-input"
              placeholder="www.uwgarage.nl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Website URL"
            />
            <button type="submit" className="btn-gold" disabled={state === "scanning"}>
              {state === "scanning" ? <Loader2 size={16} className="animate-spin" /> : null}
              Start gratis AI-scan
            </button>
          </form>
        </Reveal>
        {state === "done" && (
          <Reveal>
            <div className="scan-result">
              <span className="scan-result-label">Voorbeeldresultaat — garagevoorbeeld.nl</span>
              <div className="scan-grid">
                {missing.map((m) => (<span className="scan-miss" key={m}><X size={13} /> {m}</span>))}
              </div>
              <p className="scan-note">Dit is een voorbeeldweergave. Tijdens het gratis adviesgesprek maken we een echte analyse van uw website.</p>
              <a href="#contact" className="btn-gold mt-2">Plan gratis adviesgesprek<ArrowRight size={16} /></a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ---------- Demo teaser (links to /demo) ---------- */
function DemoTeaser() {
  return (
    <section className="section section-alt">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="demo-teaser-card">
          <div>
            <span className="eyebrow-mono">Live demo</span>
            <h2 className="section-title mt-4">Hoor hoe VELRIX Reception een APK-afspraak inplant.</h2>
            <p className="section-sub mt-3">Een interactieve simulatie van een echt klantgesprek — inclusief agenda-koppeling en WhatsApp-bevestiging.</p>
          </div>
          <Link to="/demo" className="btn-gold btn-gold-lg">
            Bekijk de demo<ArrowRight size={17} />
          </Link>
        </div>

        <div className="demo-teaser-card demo-teaser-voice">
          <div>
            <span className="eyebrow-mono">Praat er zelf mee</span>
            <h2 className="section-title mt-4">Praat met VELRIX Voice AI.</h2>
            <p className="section-sub mt-3">Geen video, geen script dat u alleen maar bekijkt — spreek zelf, live, tegen de AI-receptionist van onze demogarage.</p>
          </div>
          <Link to="/voice-demo" className="btn-gold btn-gold-lg">
            <Mic size={17} /> Start gesprek
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  const tiers = [
    { name: "Starter", price: "Website + Chatbot", features: ["Garage-website op maat", "24/7 chatbot voor klantvragen", "Offerteformulier ingebouwd", "Persoonlijke onboarding"], highlighted: false, cta: "Start met Starter" },
    { name: "Groei", price: "Website + Chatbot + AI Receptionist", features: ["Alles uit Starter", "Digitale receptionist voor telefoontjes", "Automatische agendakoppeling", "WhatsApp- en e-mailbevestigingen", "Maandelijkse optimalisatie"], highlighted: true, cta: "Kies voor Groei" },
    { name: "Pro", price: "Volledig AI-systeem", features: ["Alles uit Groei", "Koppeling met garagesoftware & facturatie", "Automatisering werkplaatsplanning", "Dedicated implementatieteam"], highlighted: false, cta: "Vraag offerte aan" },
  ];
  return (
    <section id="prijzen" className="section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Prijzen — testfase" title="Een startaanbod, bewust laag gehouden" sub="€995 implementatie + €199 per maand voor het testpakket. Geen bewezen marktprijs — we testen dit nu met de eerste garages." align="center" />
        <div className="grid lg:grid-cols-3 gap-6 mt-14 items-center">
          {tiers.map((t, i) => (
            <Reveal delay={i * 100} key={t.name}>
              <div className={`price-card ${t.highlighted ? "price-card-highlight" : ""}`}>
                {t.highlighted && <span className="price-badge">Meest gekozen</span>}
                <h3 className="price-name">{t.name}</h3>
                <p className="price-desc">{t.price}</p>
                <ul className="price-features">
                  {t.features.map((f) => (<li key={f}><Check size={14} strokeWidth={2.5} />{f}</li>))}
                </ul>
                <a href="#contact" className={t.highlighted ? "btn-gold w-full justify-center" : "btn-ghost w-full justify-center"}>{t.cta}</a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQItem({ q, a, isOpen, onToggle, id }) {
  return (
    <div className={`faq-item ${isOpen ? "faq-item-open" : ""}`}>
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen} aria-controls={`faq-panel-${id}`}>
        <span>{q}</span>
        <span className="faq-icon"><ChevronDown size={18} className="faq-chevron" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} /></span>
      </button>
      <div id={`faq-panel-${id}`} className="faq-answer-wrap" style={{ maxHeight: isOpen ? "240px" : "0px", opacity: isOpen ? 1 : 0 }}>
        <p className="faq-answer">{a}</p>
      </div>
    </div>
  );
}

function FAQ() {
  const items = [
    { q: "Kan de receptionist ook offertes geven voor onderhoud?", a: "Ja, binnen de grenzen die u instelt. Voor complexere prijsvragen draagt de AI het gesprek over aan een medewerker." },
    { q: "Werkt dit samen met onze bestaande garagesoftware?", a: "In de meeste gevallen wel. We koppelen met veelgebruikte agenda's en planningssystemen." },
    { q: "Hoe snel kan de AI-receptionist live staan?", a: "Meestal binnen twee tot drie weken, afhankelijk van de koppelingen die nodig zijn." },
    { q: "Kan de AI Nederlands spreken?", a: "Ja, gewoon vloeiend Nederlands." },
    { q: "Zit ik vast aan een lang contract?", a: "Nee. Na de opstartperiode werken we maandelijks opzegbaar." },
  ];
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="faq" className="section section-alt">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Veelgestelde vragen" title="Nog twijfels? Dit helpt vaak." align="center" />
        <div className="mt-12">
          {items.map((it, i) => (
            <Reveal delay={i * 60} key={it.q}>
              <FAQItem id={i} q={it.q} a={it.a} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
function BookingLauncher() {
  const { openBooking } = useBooking();
  return (
    <div className="calendly-card">
      <div className="calendly-head"><CalendarClock size={16} strokeWidth={1.75} /><span>Gratis kennismaking — 30 minuten</span></div>
      <p className="calendly-launcher-text">Kies zelf een moment dat uitkomt. U ziet alleen tijden waarop ik ook echt beschikbaar ben.</p>
      <button onClick={openBooking} className="btn-gold w-full justify-center">
        <CalendarClock size={16} /> Plan een gesprek
      </button>
      <span className="calendly-note">Beschikbare tijden worden automatisch aangepast aan mijn agenda.</span>
    </div>
  );
}

function Contact() {
  const [form, setForm] = useState({ naam: "", email: "", bedrijf: "", bericht: "" });
  const [submitted, setSubmitted] = useState(false);
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.naam || !form.email || !form.bericht) return;
    setSubmitted(true);
  };
  return (
    <section id="contact" className="section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeading eyebrow="Contact" title="Laten we kennismaken" sub="Plan een vrijblijvend adviesgesprek, of stuur ons kort waar u tegenaan loopt." />
        <div className="grid lg:grid-cols-[1fr_1fr] gap-5 mt-12">
          <Reveal>
            <div className="contact-info-card">
              <div className="contact-detail-list">
                <div className="contact-detail"><Mail size={17} strokeWidth={1.75} /><span>[e-mailadres]</span></div>
                <div className="contact-detail"><Clock size={17} strokeWidth={1.75} /><span>Reactie binnen 1 werkdag</span></div>
              </div>
              <div className="contact-divider" />
              <BookingLauncher />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="contact-form-card">
              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon"><Check size={22} strokeWidth={2.5} /></div>
                  <h3 className="guarantee-title">Bericht verstuurd</h3>
                  <p className="guarantee-desc mt-2">Bedankt, {form.naam.split(" ")[0]}. We nemen binnen één werkdag contact met u op.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label" htmlFor="naam">Naam</label><input id="naam" className="field-input" placeholder="Uw volledige naam" value={form.naam} onChange={update("naam")} required /></div>
                    <div className="field"><label className="field-label" htmlFor="email">E-mailadres</label><input id="email" type="email" className="field-input" placeholder="naam@garage.nl" value={form.email} onChange={update("email")} required /></div>
                  </div>
                  <div className="field"><label className="field-label" htmlFor="bedrijf">Garagenaam</label><input id="bedrijf" className="field-input" placeholder="Naam van uw garage" value={form.bedrijf} onChange={update("bedrijf")} /></div>
                  <div className="field"><label className="field-label" htmlFor="bericht">Waar kunnen we mee helpen?</label><textarea id="bericht" className="field-input field-textarea" placeholder="Vertel kort over uw garage..." rows={4} value={form.bericht} onChange={update("bericht")} required /></div>
                  <button type="submit" className="btn-gold w-full justify-center">Verstuur aanvraag<ArrowRight size={16} /></button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
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
            <ul className="footer-list"><li>Digitale receptionist</li><li>24/7 klantenservice</li><li>Werkplaats automatisering</li><li>Garage-website</li></ul>
          </div>
          <div>
            <h4 className="footer-heading">Bedrijf</h4>
            <ul className="footer-list"><li>Waarom wij</li><li>Prijzen</li><li>Veelgestelde vragen</li><li>Contact</li></ul>
          </div>
          <div>
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-list"><li>[e-mailadres]</li><li>[telefoonnummer]</li><li>[website]</li></ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} VELRIX. Alle rechten voorbehouden. KvK: volgt · BTW: volgt</span>
          <div className="flex gap-6"><span>Privacybeleid</span><span>Algemene voorwaarden</span></div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Root ---------- */
export default function Home() {
  const rootRef = useRef(null);
  useMouseGlow(rootRef);

  return (
    <div className="velrix-home" ref={rootRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .velrix-home {
          --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71;
          --glass-bg: rgba(255,255,255,0.035); --glass-border: rgba(255,255,255,0.09); --mx:50%; --my:50%;
          background: var(--ink); color: var(--text); font-family:'Inter',ui-sans-serif,system-ui,sans-serif;
          position: relative; overflow-x: hidden; -webkit-font-smoothing: antialiased;
        }
        .velrix-home::before { content:''; position: fixed; inset:0; z-index:1; pointer-events:none;
          background: radial-gradient(560px circle at var(--mx) var(--my), rgba(201,166,104,0.055), transparent 60%); }
        .velrix-home h1, .velrix-home h2, .velrix-home h3 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-0.01em; }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
        .glass-card { background: var(--glass-bg); border:1px solid var(--glass-border); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }

        .nav-wrap { position: sticky; top:0; z-index:50; border-bottom:1px solid transparent; transition:.35s; }
        .nav-scrolled { background: rgba(10,11,13,0.78); backdrop-filter: blur(16px); border-bottom:1px solid var(--border); }
        .brand-mark { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; background: linear-gradient(150deg, var(--gold-bright), var(--gold-dim)); color:#16130a; }
        .brand-word { font-family:'Fraunces',serif; font-weight:600; font-size:17px; letter-spacing:.02em; color: var(--text); }
        .brand-suffix { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--gold); border:1px solid var(--border-strong); border-radius:5px; padding:1px 6px; }
        .nav-link { font-size:14px; color: var(--text-muted); text-decoration:none; }
        .nav-link:hover { color: var(--text); }
        .mobile-menu { display:flex; flex-direction:column; padding:8px 24px 24px; gap:2px; background: var(--ink); border-bottom:1px solid var(--border); }
        .mobile-link { padding:12px 4px; font-size:15px; color: var(--text-muted); border-bottom:1px solid var(--border); text-decoration:none; }

        .btn-gold, .btn-gold-sm { position:relative; display:inline-flex; align-items:center; gap:8px; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; border-radius:10px; text-decoration:none; border:none; cursor:pointer;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, filter .25s; box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 10px 30px -12px rgba(201,166,104,.55); }
        .btn-gold { padding:13px 24px; font-size:15px; } .btn-gold-lg { padding:16px 28px; font-size:15.5px; } .btn-gold-sm { padding:9px 18px; font-size:13.5px; }
        .btn-gold:hover, .btn-gold-sm:hover { transform: translateY(-2px); filter: brightness(1.06); }
        .btn-gold:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .btn-gold-glow { position:absolute; inset:-40%; background: radial-gradient(circle, rgba(255,255,255,.5), transparent 60%); opacity:0; transition:.4s; }
        .btn-gold-lg:hover .btn-gold-glow { opacity:.25; }
        .btn-arrow { transition: transform .25s; } .btn-gold:hover .btn-arrow { transform: translateX(3px); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; padding:13px 22px; border:1px solid var(--border-strong); border-radius:10px; color: var(--text); font-weight:500; font-size:15px; text-decoration:none; background: rgba(255,255,255,.02); transition:.25s; }
        .btn-ghost:hover { border-color: var(--gold-dim); background: rgba(201,166,104,.06); transform: translateY(-2px); }

        .hero-section { position:relative; overflow:hidden; }
        .hero-mesh { position:absolute; top:-220px; left:50%; transform:translateX(-50%); width:1100px; height:640px;
          background: radial-gradient(ellipse at 30% 30%, rgba(201,166,104,.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(138,115,63,.14) 0%, transparent 55%); filter: blur(10px); pointer-events:none; z-index:0; }
        .hero-grid { position:absolute; inset:0; z-index:0; pointer-events:none; background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px); background-size:64px 64px;
          -webkit-mask-image: radial-gradient(ellipse 700px 420px at 50% 20%, black, transparent 75%); mask-image: radial-gradient(ellipse 700px 420px at 50% 20%, black, transparent 75%); }
        .hero-orb { position:absolute; border-radius:50%; filter: blur(60px); pointer-events:none; z-index:0; }
        .hero-orb-1 { width:340px; height:340px; top:60px; right:6%; background: radial-gradient(circle, rgba(201,166,104,.22), transparent 70%); }
        .hero-orb-2 { width:260px; height:260px; bottom:-60px; left:2%; background: radial-gradient(circle, rgba(138,115,63,.18), transparent 70%); }
        .eyebrow { display:inline-flex; align-items:center; gap:8px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; letter-spacing:.04em; color: var(--gold-bright); border:1px solid var(--border-strong); background: rgba(201,166,104,.06); padding:7px 14px; border-radius:999px; }
        .hero-title { font-size: clamp(2.8rem, 6.4vw, 5rem); line-height:1.02; font-weight:500; max-width:14ch; color: var(--text); position:relative; z-index:1; }
        .hero-title-accent { font-style:italic; font-weight:400; background: linear-gradient(120deg, var(--gold-bright), var(--gold)); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .hero-sub { margin-top:24px; font-size:17px; line-height:1.65; color: var(--text-muted); max-width:42ch; position:relative; z-index:1; }
        .hero-trust-pills { margin-top:48px; display:flex; flex-wrap:wrap; gap:10px; }
        .hero-trust-pill { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color: var(--text-muted); border:1px solid var(--border); border-radius:999px; padding:7px 13px; background: rgba(255,255,255,.02); }
        .hero-trust-pill svg { color: var(--gold); }

        .hero-mockup-wrap { position:relative; z-index:1; } .hero-mockup-stage { position:relative; padding:20px; }
        .dash-card { border-radius:18px; overflow:hidden; box-shadow:0 40px 80px -30px rgba(0,0,0,.65); transform: perspective(1200px) rotateY(-6deg) rotateX(2deg); }
        .dash-topbar { display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid var(--glass-border); }
        .dash-dots { display:flex; gap:6px; } .dash-dots span { width:8px; height:8px; border-radius:50%; background: var(--border-strong); }
        .dash-title { font-family:'IBM Plex Mono',monospace; font-size:11.5px; color: var(--text-dim); }
        .dash-body { display:flex; } .dash-nav { display:flex; flex-direction:column; gap:14px; padding:20px 14px; border-right:1px solid var(--glass-border); }
        .dash-nav-dot { width:8px; height:8px; border-radius:50%; background: var(--border-strong); } .dash-nav-dot.active { background: var(--gold); box-shadow: 0 0 0 4px rgba(201,166,104,.15); }
        .dash-main { flex:1; padding:20px; } .dash-tiles { display:flex; gap:10px; margin-bottom:18px; }
        .dash-tile { flex:1; border:1px solid var(--glass-border); border-radius:12px; padding:12px 14px; background: rgba(255,255,255,.02); }
        .dash-tile-label { display:block; font-size:10.5px; color: var(--text-dim); margin-bottom:6px; } .dash-tile-value { font-family:'Fraunces',serif; font-size:20px; color: var(--gold-bright); }
        .dash-chart { display:flex; align-items:flex-end; gap:8px; height:90px; }
        .dash-bar { flex:1; border-radius:4px 4px 0 0; background: linear-gradient(180deg, var(--gold-bright), var(--gold-dim)); height:var(--h); opacity:.9; animation: bar-grow .9s cubic-bezier(.22,1,.36,1) both; animation-delay: var(--d); }
        @keyframes bar-grow { from { transform: scaleY(0); transform-origin:bottom; } to { transform: scaleY(1); transform-origin:bottom; } }
        .dash-caption { display:block; margin-top:12px; font-size:10.5px; color: var(--text-dim); font-family:'IBM Plex Mono',monospace; }
        .chat-float-position { position:absolute; bottom:-26px; left:-30px; width:240px; animation: float-y 5s ease-in-out infinite; }
        @keyframes float-y { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .chat-float { border-radius:16px; padding:14px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.6); }
        .chat-float-header { display:flex; align-items:center; gap:7px; font-size:11.5px; color: var(--text-muted); margin-bottom:10px; }
        .chat-online-dot { width:6px; height:6px; border-radius:50%; background:#6fd18a; box-shadow: 0 0 0 3px rgba(111,209,138,.2); }
        .chat-float-body { display:flex; flex-direction:column; gap:7px; }
        .chat-bubble { font-size:12.5px; line-height:1.45; padding:8px 12px; border-radius:12px; max-width:92%; }
        .chat-bubble-bot { background: rgba(255,255,255,.05); border:1px solid var(--glass-border); color: var(--text); align-self:flex-start; border-bottom-left-radius:4px; }
        .chat-bubble-user { background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; align-self:flex-end; border-bottom-right-radius:4px; font-weight:500; }
        .chat-typing { display:flex; gap:4px; align-items:center; padding:10px 12px; }
        .chat-typing span { width:5px; height:5px; border-radius:50%; background: var(--text-dim); animation: typing-bounce 1.2s infinite ease-in-out; }
        .chat-typing span:nth-child(2) { animation-delay:.15s; } .chat-typing span:nth-child(3) { animation-delay:.3s; }
        @keyframes typing-bounce { 0%,60%,100% { transform: translateY(0); opacity:.5; } 30% { transform: translateY(-4px); opacity:1; } }

        .proof-band { border-top:1px solid var(--border); border-bottom:1px solid var(--border); background: var(--ink-2); position:relative; z-index:1; }
        .proof-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:14px 36px; }
        .proof-item { display:flex; align-items:center; gap:10px; font-size:13.5px; color: var(--text-muted); }
        .proof-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; background: rgba(201,166,104,.08); border:1px solid var(--border-strong); color: var(--gold-bright); }

        .section { padding:108px 0; position:relative; z-index:1; }
        .section-alt { background: var(--ink-2); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
        .section-heading { max-width:640px; } .eyebrow-mono { font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color: var(--gold); }
        .section-title { margin-top:14px; font-size: clamp(1.8rem, 3.4vw, 2.6rem); font-weight:500; line-height:1.15; color: var(--text); }
        .section-sub { margin-top:14px; font-size:16px; line-height:1.65; color: var(--text-muted); }

        .service-card { position:relative; overflow:hidden; border:1px solid var(--border); background: linear-gradient(180deg, var(--surface), rgba(21,23,27,.4)); border-radius:18px; padding:32px; height:100%; transition:.35s; }
        .service-card:hover { border-color: var(--gold-dim); transform: translateY(-6px); box-shadow: 0 28px 54px -24px rgba(0,0,0,.65); }
        .service-card-glow { position:absolute; inset:0; pointer-events:none; z-index:0; background: radial-gradient(340px circle at 20% 0%, rgba(201,166,104,.10), transparent 60%); transition:.4s; }
        .service-icon { position:relative; z-index:1; width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; background: rgba(201,166,104,.08); border:1px solid var(--border-strong); color: var(--gold-bright); margin-bottom:20px; transition:.35s; }
        .service-card:hover .service-icon { transform: scale(1.08) rotate(-4deg); }
        .service-title { position:relative; z-index:1; font-size:21px; font-weight:500; color: var(--text); }
        .service-desc { position:relative; z-index:1; margin-top:10px; font-size:14.5px; line-height:1.6; color: var(--text-muted); }
        .service-points { position:relative; z-index:1; margin-top:20px; display:flex; flex-direction:column; gap:10px; }
        .service-points li { display:flex; align-items:center; gap:9px; font-size:13.5px; color: var(--text-muted); } .service-points li svg { color: var(--gold); }
        .service-cta { position:relative; z-index:1; display:inline-flex; align-items:center; gap:6px; margin-top:24px; font-size:13.5px; font-weight:600; color: var(--gold-bright); text-decoration:none; }
        .service-cta svg { transition: transform .25s; } .service-card:hover .service-cta svg { transform: translate(2px,-2px); }

        .process-track { margin-top:64px; position:relative; }
        .process-line { position:absolute; top:22px; left:6%; right:6%; height:1px; background: var(--border-strong); z-index:0; display:none; }
        .process-line-fill { height:100%; background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright)); transition: width 1.4s cubic-bezier(.22,1,.36,1); }
        .process-steps { display:grid; gap:40px; position:relative; z-index:1; } .process-step { text-align:left; }
        .process-node { width:44px; height:44px; border-radius:50%; background: var(--surface); border:1px solid var(--border-strong); display:flex; align-items:center; justify-content:center; color: var(--gold-bright); margin-bottom:16px; }
        .process-num { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--text-dim); display:block; margin-bottom:6px; }
        .process-title { font-size:18px; font-weight:600; color: var(--text); } .process-desc { margin-top:6px; font-size:13.5px; line-height:1.6; color: var(--text-muted); max-width:30ch; }
        @media (min-width:900px) { .process-line { display:block; } .process-steps { grid-template-columns: repeat(4,1fr); } .process-step { text-align:center; } .process-node { margin-left:auto; margin-right:auto; } .process-desc { margin-left:auto; margin-right:auto; } }

        .compare-card { border:1px solid var(--border); border-radius:18px; overflow:hidden; background: var(--surface); }
        .compare-head { display:grid; grid-template-columns:1fr 1fr; }
        .compare-head-cell { padding:16px 18px; font-size:12.5px; font-weight:600; letter-spacing:.03em; }
        .compare-head-them { color: var(--text-dim); background: rgba(255,255,255,.02); }
        .compare-head-us { color:#17130a; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); display:flex; align-items:center; gap:6px; }
        .compare-row { display:grid; grid-template-columns:1fr; border-top:1px solid var(--border); padding:14px 18px 4px; }
        .compare-label { font-size:11.5px; color: var(--text-dim); text-transform:uppercase; letter-spacing:.04em; margin-bottom:8px; }
        .compare-cell { display:flex; align-items:center; gap:8px; font-size:13.5px; padding:6px 0; }
        .compare-cell-them { color: var(--text-dim); } .compare-cell-them svg { color: var(--text-dim); }
        .compare-cell-us { color: var(--text); font-weight:500; } .compare-cell-us svg { color: var(--gold); }
        @media (min-width:640px) { .compare-row { grid-template-columns:.9fr 1fr 1fr; align-items:center; padding:16px 18px; } .compare-label { margin-bottom:0; } }

        .guarantee-card { border:1px solid var(--border); background: var(--surface); border-radius:16px; padding:24px; height:100%; }
        .guarantee-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; background: rgba(201,166,104,.1); border:1px solid var(--border-strong); color: var(--gold-bright); margin-bottom:14px; }
        .guarantee-title { font-size:15.5px; font-weight:600; color: var(--text); } .guarantee-desc { margin-top:6px; font-size:13px; line-height:1.6; color: var(--text-muted); }

        .case-card { border:1px dashed var(--border-strong); border-radius:20px; padding:48px 32px; position:relative; }
        .case-badge { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.06em; color: var(--gold-bright); border:1px solid var(--border-strong); background: rgba(201,166,104,.08); border-radius:999px; padding:5px 14px; margin-bottom:18px; }

        .scan-form { display:flex; flex-direction:column; sm:flex-row; gap:10px; margin-top:32px; max-width:520px; margin-left:auto; margin-right:auto; }
        .scan-input { flex:1; background: var(--ink-2); border:1px solid var(--border-strong); border-radius:10px; padding:13px 16px; font-size:14.5px; color: var(--text); outline:none; }
        .scan-input:focus { border-color: var(--gold-dim); }
        .scan-result { margin-top:32px; border:1px solid var(--border); border-radius:16px; padding:26px; background: var(--surface); text-align:left; }
        .scan-result-label { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--text-dim); }
        .scan-grid { display:grid; sm:grid-cols-2; gap:10px; margin-top:16px; }
        .scan-miss { display:flex; align-items:center; gap:8px; font-size:13.5px; color: var(--text-muted); } .scan-miss svg { color:#e6947a; }
        .scan-note { margin-top:16px; font-size:12px; color: var(--text-dim); }

        .demo-teaser-card { border:1px solid var(--border-strong); border-radius:20px; background: linear-gradient(180deg, rgba(201,166,104,.06), var(--surface)); padding:40px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:24px; }
        .demo-teaser-voice { margin-top:20px; }

        .price-card { position:relative; display:flex; flex-direction:column; border:1px solid var(--border); background: var(--surface); border-radius:20px; padding:32px; height:100%; transition:.35s; }
        .price-card:hover { transform: translateY(-5px); border-color: var(--border-strong); }
        .price-card-highlight { border-color: var(--gold-dim); background: linear-gradient(180deg, rgba(201,166,104,.09), var(--surface) 60%); box-shadow: 0 34px 66px -30px rgba(201,166,104,.3); transform: scale(1.04); }
        .price-badge { position:absolute; top:-13px; left:32px; font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.05em; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; padding:4px 12px; border-radius:999px; font-weight:600; }
        .price-name { font-size:19px; font-weight:600; color: var(--text); } .price-desc { margin-top:8px; font-size:13.5px; color: var(--text-muted); min-height:40px; }
        .price-features { display:flex; flex-direction:column; gap:11px; margin:20px 0 28px; flex-grow:1; }
        .price-features li { display:flex; align-items:center; gap:9px; font-size:13.5px; color: var(--text-muted); } .price-features li svg { color: var(--gold); }

        .faq-item { border-bottom:1px solid var(--border); transition: background .3s; } .faq-item-open { background: rgba(201,166,104,.03); }
        .faq-question { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:22px 16px; background:none; border:none; text-align:left; font-size:16px; font-weight:500; color: var(--text); cursor:pointer; }
        .faq-icon { width:26px; height:26px; border-radius:50%; border:1px solid var(--border-strong); display:flex; align-items:center; justify-content:center; transition: border-color .25s; }
        .faq-item-open .faq-icon { border-color: var(--gold-dim); background: rgba(201,166,104,.08); }
        .faq-chevron { color: var(--gold); transition: transform .35s cubic-bezier(.22,1,.36,1); }
        .faq-answer-wrap { overflow:hidden; transition: max-height .4s cubic-bezier(.22,1,.36,1), opacity .3s; }
        .faq-answer { padding:0 16px 22px; font-size:14.5px; line-height:1.65; color: var(--text-muted); max-width:62ch; }

        .contact-info-card, .contact-form-card { border:1px solid var(--border); background: var(--surface); border-radius:20px; padding:36px; height:100%; }
        .contact-detail-list { display:flex; flex-direction:column; gap:16px; } .contact-detail { display:flex; align-items:center; gap:12px; font-size:14.5px; color: var(--text-muted); } .contact-detail svg { color: var(--gold); }
        .contact-divider { height:1px; background: var(--border); margin:28px 0; }
        .calendly-card { border:1px solid var(--border-strong); border-radius:16px; padding:20px; background: rgba(255,255,255,.02); }
        .calendly-head { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600; color: var(--text); margin-bottom:16px; } .calendly-head svg { color: var(--gold); }
        .calendly-days { display:flex; gap:6px; margin-bottom:14px; }
        .calendly-day { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; border-radius:9px; border:1px solid var(--border-strong); background:transparent; cursor:pointer; color: var(--text-muted); }
        .calendly-day-active { border-color: var(--gold-dim); background: rgba(201,166,104,.1); color: var(--gold-bright); }
        .calendly-day-name { font-size:10.5px; } .calendly-day-num { font-size:13px; font-weight:600; }
        .calendly-slots { display:grid; grid-template-columns: repeat(2,1fr); gap:8px; margin-bottom:12px; }
        .calendly-slot { padding:9px; border-radius:9px; border:1px solid var(--border-strong); background:transparent; color: var(--text-muted); font-size:12.5px; cursor:pointer; }
        .calendly-slot:hover { border-color: var(--gold-dim); color: var(--text); }
        .calendly-note { display:block; font-size:10.5px; color: var(--text-dim); text-align:center; margin-top:10px; }
        .calendly-launcher-text { font-size:13px; color: var(--text-muted); line-height:1.55; margin-bottom:16px; }
        .contact-form { display:flex; flex-direction:column; gap:18px; } .field { display:flex; flex-direction:column; gap:7px; } .field-label { font-size:12.5px; color: var(--text-dim); }
        .field-input { background: var(--ink-2); border:1px solid var(--border-strong); border-radius:10px; padding:12px 14px; font-size:14.5px; color: var(--text); font-family:'Inter',sans-serif; outline:none; }
        .field-input:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px rgba(201,166,104,.12); } .field-textarea { resize:vertical; min-height:100px; }
        .contact-success { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; height:100%; padding:20px 4px; }
        .contact-success-icon { width:44px; height:44px; border-radius:12px; background: rgba(201,166,104,.12); border:1px solid var(--gold-dim); color: var(--gold-bright); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }

        .footer { border-top:1px solid var(--border); background: var(--ink); position:relative; z-index:1; }
        .footer-newsletter { border-radius:20px; padding:28px 32px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px; }
        .footer-form { display:flex; gap:8px; } .footer-form input { background: rgba(255,255,255,.03); border:1px solid var(--border-strong); border-radius:10px; padding:11px 14px; font-size:14px; color: var(--text); outline:none; min-width:220px; }
        .footer-form button { padding:11px 20px; border-radius:10px; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:13.5px; border:none; cursor:pointer; }
        .footer-subscribed { display:flex; align-items:center; gap:8px; font-size:13.5px; color: var(--gold-bright); }
        .footer-desc { margin-top:4px; font-size:13.5px; color: var(--text-dim); max-width:32ch; }
        .footer-socials { display:flex; gap:10px; margin-top:20px; }
        .footer-social { width:34px; height:34px; border-radius:9px; border:1px solid var(--border-strong); display:flex; align-items:center; justify-content:center; color: var(--text-muted); transition:.25s; }
        .footer-social:hover { border-color: var(--gold-dim); color: var(--gold-bright); transform: translateY(-2px); }
        .footer-heading { font-size:12.5px; letter-spacing:.06em; text-transform:uppercase; color: var(--text-dim); margin-bottom:14px; }
        .footer-list { display:flex; flex-direction:column; gap:10px; font-size:14px; color: var(--text-muted); }
        .footer-bottom { margin-top:56px; padding-top:24px; border-top:1px solid var(--border); display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; font-size:12.5px; color: var(--text-dim); }

        @media (max-width:899px) { .hero-mockup-stage { transform: scale(.94); } .dash-card { transform:none; } .chat-float-position { position:static; width:100%; margin-top:16px; animation:none; } }
        @media (prefers-reduced-motion: reduce) { .velrix-home *, .velrix-home *::before, .velrix-home *::after { animation:none !important; transition:none !important; } }
      `}</style>

      <BookingProvider>
        <Nav />
        <main>
          <Hero />
          <TrustBand />
          <Services />
          <ProcessTimeline />
          <WhyUs />
          <Guarantees />
          <CaseStudy />
          <ScanSection />
          <DemoTeaser />
          <Pricing />
          <FAQ />
          <Contact />
        </main>
        <Footer />
      </BookingProvider>
    </div>
  );
}
