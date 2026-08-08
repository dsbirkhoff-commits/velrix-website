import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Gauge,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  Check,
  Sparkles,
  CalendarClock,
  MessageCircle,
  Mail,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Car,
} from "lucide-react";

/* ===========================================================
   Scenario data
=========================================================== */
const CUSTOMER_NAME = "R. de Vries";
const CUSTOMER_PLATE = "77-XYZ-3";

const SLOTS = [
  { id: "10:00", day: "Woensdag", time: "10:00" },
  { id: "15:30", day: "Woensdag", time: "15:30" },
];

const STEP_META = [
  { key: "ringing", label: "Inkomend gesprek", icon: PhoneIncoming },
  { key: "answer", label: "AI neemt op", icon: PhoneCall },
  { key: "ask", label: "Klant vraagt", icon: MessageCircle },
  { key: "understand", label: "AI begrijpt", icon: Sparkles },
  { key: "slots", label: "Opties tonen", icon: CalendarClock },
  { key: "confirmcust", label: "Klant bevestigt", icon: Check },
  { key: "calendar", label: "Agenda bijgewerkt", icon: CalendarClock },
  { key: "confirmed", label: "Bevestiging verstuurd", icon: Mail },
];

/* Build transcript incrementally based on current step + chosen slot */
function buildMessages(step, slot) {
  const msgs = [];
  if (step >= 2) {
    msgs.push({
      from: "ai",
      text: "VELRIX Demo Garage, goedemiddag! U spreekt met de digitale assistent. Waarmee kan ik u helpen?",
    });
  }
  if (step >= 3) {
    msgs.push({
      from: "klant",
      text: "Hoi, mijn auto moet APK gekeurd worden. Hebben jullie deze week nog plek?",
    });
  }
  if (step >= 4) {
    msgs.push({
      from: "ai",
      text: "Goedemiddag! Jazeker. Ik kan voor u kijken naar de beschikbare momenten. Op welke dag zou u het liefst langskomen?",
      intent: "Intentie herkend: APK-afspraak inplannen",
    });
  }
  if (step >= 4.5) {
    msgs.push({ from: "klant", text: "Woensdag zou mooi zijn, als dat kan." });
  }
  if (step >= 5) {
    msgs.push({
      from: "ai",
      text: "Woensdag heb ik nog ruimte om 10:00 uur en om 15:30 uur. Wat komt u het beste uit?",
    });
  }
  if (step >= 6 && slot) {
    msgs.push({
      from: "klant",
      text: `${slot.time} uur is prima. Mijn naam is ${CUSTOMER_NAME}, kenteken ${CUSTOMER_PLATE}.`,
    });
  }
  if (step >= 7 && slot) {
    msgs.push({
      from: "ai",
      text: `Genoteerd — woensdag ${slot.time} uur voor een APK-keuring, op naam van ${CUSTOMER_NAME}. Ik zet de afspraak direct in de agenda.`,
    });
  }
  if (step >= 8 && slot) {
    msgs.push({
      from: "ai",
      text: "Helemaal geregeld! U ontvangt zo een bevestiging per WhatsApp en e-mail. Nog een prettige dag verder.",
    });
  }
  return msgs;
}

/* ===========================================================
   Small UI building blocks
=========================================================== */
function TypingDots() {
  return (
    <div className="bubble bubble-ai typing-bubble">
      <span /> <span /> <span />
    </div>
  );
}

function Waveform({ active }) {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{ "--i": i, animationPlayState: active ? "running" : "paused" }}
        />
      ))}
    </div>
  );
}

function useCallTimer(running) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (!running) setSeconds(0);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { seconds, label: `${mm}:${ss}` };
}

/* ===========================================================
   Main demo
=========================================================== */
export default function VelrixReceptionDemo() {
  const [step, setStep] = useState(0); // 0 = not started
  const [slot, setSlot] = useState(null);
  const [autoplay, setAutoplay] = useState(false);
  const scrollRef = useRef(null);

  const phoneConnected = step >= 2 && step < 8.5;
  const phoneRinging = step === 1;
  const callEnded = step >= 8.5;
  const timer = useCallTimer(phoneConnected);

  const messages = buildMessages(step, slot);
  const showTyping =
    step > 0 &&
    step < 8.5 &&
    Number.isInteger(step) === false === false && // no-op guard
    false;

  // Determine active step index (1-8) for progress bar, mapping half-steps down
  const activeStepIndex = Math.min(8, Math.floor(step));

  const canAutoAdvance = step !== 5; // pause automatically at slot-choice for interactivity
  const isAtEnd = step >= 8;

  const advance = useCallback(() => {
    setStep((s) => {
      if (s === 0) return 1;
      if (s === 1) return 2;
      if (s === 2) return 3;
      if (s === 3) return 4;
      if (s === 4) return 4.5;
      if (s === 4.5) return 5;
      if (s === 5) return 5; // wait for manual slot pick
      if (s === 6) return 7;
      if (s === 7) return 8;
      return 8;
    });
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => {
      if (s <= 1) return 0;
      if (s === 4.5) return 4;
      if (s === 5) return 4.5;
      if (s === 6) return 5;
      return Math.floor(s) - 1;
    });
  }, []);

  const reset = () => {
    setStep(0);
    setSlot(null);
    setAutoplay(false);
  };

  const pickSlot = (s) => {
    setSlot(s);
    setStep(6);
  };

  // autoplay engine
  useEffect(() => {
    if (!autoplay) return;
    if (isAtEnd) {
      setAutoplay(false);
      return;
    }
    if (step === 5) return; // wait for the presenter/prospect to click a slot
    const t = setTimeout(() => advance(), 1600);
    return () => clearTimeout(t);
  }, [autoplay, step, advance, isAtEnd]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const isThinking = [1.5].includes(step); // reserved, unused currently

  return (
    <div className="velrix-demo">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .velrix-demo {
          --ink: #0a0b0d;
          --ink-2: #101216;
          --surface: #15171b;
          --border: #24272d;
          --border-strong: #34383f;
          --gold: #c9a668;
          --gold-bright: #e6cd94;
          --gold-dim: #8a733f;
          --text: #f3f1ec;
          --text-muted: #9a9c9f;
          --text-dim: #6b6d71;
          --green: #6fd18a;

          background: var(--ink);
          color: var(--text);
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          min-height: 100%;
          padding: 28px 20px 48px;
          -webkit-font-smoothing: antialiased;
        }
        .velrix-demo h1, .velrix-demo h2, .velrix-demo h3 { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
        .wrap { max-width: 1080px; margin: 0 auto; }

        /* header */
        .brand-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-mark { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: linear-gradient(150deg, var(--gold-bright), var(--gold-dim)); color: #17130a; }
        .brand-word { font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; }
        .brand-suffix { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--gold); border: 1px solid var(--border-strong); border-radius: 5px; padding: 1px 7px; }
        .brand-tagline { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--text-dim); letter-spacing: 0.02em; margin-left: 8px; padding-left: 12px; border-left: 1px solid var(--border-strong); }
        @media (max-width: 640px) { .brand-tagline { display: none; } }
        .garage-tag { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--text-muted); }
        .garage-tag svg { color: var(--gold); }

        .demo-banner {
          display: flex; align-items: center; gap: 10px;
          border: 1px solid var(--border-strong);
          background: rgba(201,166,104,0.07);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 22px;
        }
        .demo-banner strong { color: var(--gold-bright); }
        .demo-dot { width: 7px; height: 7px; border-radius: 50%; background: #e6947a; box-shadow: 0 0 0 3px rgba(230,148,122,0.2); flex-shrink: 0; animation: pulse-dot 1.6s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

        /* progress */
        .progress-row { display: flex; gap: 6px; margin-bottom: 26px; overflow-x: auto; padding-bottom: 4px; }
        .progress-step {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; color: var(--text-dim);
          border: 1px solid var(--border); border-radius: 999px;
          padding: 6px 12px; white-space: nowrap; flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .progress-step svg { width: 12px; height: 12px; }
        .progress-step.done { color: var(--text-muted); border-color: var(--border-strong); }
        .progress-step.active { color: #17130a; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); border-color: transparent; font-weight: 600; }

        /* layout */
        .demo-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
        @media (min-width: 880px) { .demo-grid { grid-template-columns: 340px 1fr; } }

        /* phone card */
        .phone-card {
          border: 1px solid var(--border); border-radius: 24px;
          background: linear-gradient(180deg, var(--surface), rgba(21,23,27,0.5));
          padding: 26px 22px; position: relative; overflow: hidden;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          min-height: 380px; justify-content: center;
        }
        .phone-demo-badge {
          position: absolute; top: 14px; right: 14px;
          font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.06em;
          color: var(--text-dim); border: 1px solid var(--border-strong); border-radius: 6px;
          padding: 3px 7px; display: flex; align-items: center; gap: 5px;
        }
        .caller-avatar {
          width: 74px; height: 74px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,166,104,0.1); border: 1px solid var(--border-strong);
          color: var(--gold-bright); margin-bottom: 16px;
        }
        .caller-avatar.ringing { animation: ring-pulse 1.1s ease-in-out infinite; }
        @keyframes ring-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,166,104,0.3); } 50% { box-shadow: 0 0 0 14px rgba(201,166,104,0); } }
        .caller-name { font-size: 15px; font-weight: 600; color: var(--text); }
        .caller-sub { font-size: 12.5px; color: var(--text-dim); margin-top: 3px; margin-bottom: 18px; }
        .call-status { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--gold-bright); margin-bottom: 14px; letter-spacing: 0.04em; }
        .call-timer { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--text-muted); margin-top: 14px; }

        .waveform { display: flex; align-items: center; gap: 3px; height: 40px; }
        .wave-bar { width: 3px; border-radius: 3px; background: linear-gradient(180deg, var(--gold-bright), var(--gold-dim)); height: 10px; animation: wave-bounce 1.1s ease-in-out infinite; animation-delay: calc(var(--i) * 0.05s); }
        @keyframes wave-bounce { 0%,100% { height: 8px; opacity: 0.5; } 50% { height: 32px; opacity: 1; } }

        .call-btns { display: flex; gap: 10px; margin-top: 20px; }
        .call-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); }
        .call-pill.live { color: var(--green); border-color: rgba(111,209,138,0.3); background: rgba(111,209,138,0.08); }
        .call-pill.ended { color: #e6947a; border-color: rgba(230,148,122,0.3); background: rgba(230,148,122,0.08); }

        /* console */
        .console-card { border: 1px solid var(--border); border-radius: 22px; background: var(--surface); display: flex; flex-direction: column; min-height: 420px; overflow: hidden; }
        .console-head { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--text-dim); letter-spacing: 0.04em; }
        .console-head svg { color: var(--gold); }

        .transcript { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; min-height: 180px; }
        .transcript-empty { margin: auto; text-align: center; color: var(--text-dim); font-size: 13.5px; max-width: 30ch; }

        .bubble { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.55; }
        .bubble-ai { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid var(--border-strong); border-bottom-left-radius: 4px; }
        .bubble-klant { align-self: flex-end; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color: #17130a; font-weight: 500; border-bottom-right-radius: 4px; }
        .intent-chip { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--gold-bright); border: 1px solid var(--border-strong); background: rgba(201,166,104,0.08); border-radius: 999px; padding: 4px 10px; margin-top: -2px; }
        .typing-bubble { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
        .typing-bubble span { width: 5px; height: 5px; border-radius: 50%; background: var(--text-dim); animation: dot-bounce 1.2s infinite ease-in-out; }
        .typing-bubble span:nth-child(2) { animation-delay: .15s; }
        .typing-bubble span:nth-child(3) { animation-delay: .3s; }
        @keyframes dot-bounce { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }

        /* slots + calendar + confirmation panels inside console footer */
        .console-panel { border-top: 1px solid var(--border); padding: 16px 20px; }
        .panel-label { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; color: var(--text-dim); margin-bottom: 10px; text-transform: uppercase; }
        .slot-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .slot-btn {
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
          padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border-strong);
          background: rgba(255,255,255,0.02); color: var(--text); cursor: pointer; transition: all 0.2s ease;
        }
        .slot-btn:hover { border-color: var(--gold-dim); background: rgba(201,166,104,0.08); transform: translateY(-2px); }
        .slot-btn .day { font-size: 11px; color: var(--text-dim); }
        .slot-btn .time { font-family: 'IBM Plex Mono', monospace; font-size: 15px; color: var(--gold-bright); }
        .slot-btn.chosen { border-color: var(--gold); background: rgba(201,166,104,0.14); }

        .mini-cal { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .mini-cal-day { border: 1px solid var(--border-strong); border-radius: 10px; padding: 8px 6px; text-align: center; }
        .mini-cal-day .d { font-size: 10px; color: var(--text-dim); }
        .mini-cal-day .n { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .mini-cal-day.booked { border-color: var(--gold); background: rgba(201,166,104,0.12); }
        .mini-cal-day.booked .n { color: var(--gold-bright); }
        .booked-tag { margin-top: 6px; font-size: 9px; color: var(--gold-bright); font-family: 'IBM Plex Mono', monospace; }

        .confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .confirm-item { border: 1px solid var(--border-strong); border-radius: 10px; padding: 9px 12px; }
        .confirm-item .k { font-size: 10px; color: var(--text-dim); }
        .confirm-item .v { font-size: 13px; color: var(--text); margin-top: 2px; }
        .ping-row { display: flex; gap: 10px; }
        .ping-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--green); border: 1px solid rgba(111,209,138,0.3); background: rgba(111,209,138,0.08); border-radius: 999px; padding: 6px 12px; }

        /* controls */
        .controls-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
        .controls-left { display: flex; gap: 8px; }
        .ctrl-btn {
          display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;
          padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border-strong);
          background: rgba(255,255,255,0.02); color: var(--text); cursor: pointer; transition: all 0.2s ease;
        }
        .ctrl-btn:hover:not(:disabled) { border-color: var(--gold-dim); background: rgba(201,166,104,0.08); }
        .ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ctrl-btn.primary { background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color: #17130a; border-color: transparent; font-weight: 600; }
        .hint { font-size: 12px; color: var(--text-dim); }

        /* recap */
        .recap-card { margin-top: 26px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); padding: 22px 24px; }
        .recap-title { font-size: 16px; font-weight: 600; }
        .recap-list { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 12px; }
        @media (min-width: 680px) { .recap-list { grid-template-columns: 1fr 1fr; } }
        .recap-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
        .recap-list li svg { color: var(--gold); flex-shrink: 0; }

        @media (prefers-reduced-motion: reduce) {
          .velrix-demo *, .velrix-demo *::before, .velrix-demo *::after { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="wrap">
        <div className="brand-row">
          <div className="brand">
            <span className="brand-mark"><Gauge size={16} strokeWidth={2} /></span>
            <span className="brand-word">VELRIX</span>
            <span className="brand-suffix">Reception</span>
            <span className="brand-tagline">Intelligent systems for business.</span>
          </div>
          <div className="garage-tag">
            <Wrench size={14} />
            Live demo voor: <strong style={{ color: "var(--text)" }}>VELRIX Demo Garage</strong>
          </div>
        </div>

        <div className="demo-banner">
          <span className="demo-dot" />
          <span><strong>DEMO</strong> — dit is een gesimuleerde weergave van VELRIX Reception, ter illustratie. Er wordt geen echt telefoongesprek gevoerd; in het echte product neemt de AI-receptionist daadwerkelijk telefoontjes op.</span>
        </div>

        <div className="progress-row">
          {STEP_META.map((s, i) => {
            const n = i + 1;
            const state = activeStepIndex > n ? "done" : activeStepIndex === n ? "active" : "";
            return (
              <div key={s.key} className={`progress-step ${state}`}>
                <s.icon />
                {n}. {s.label}
              </div>
            );
          })}
        </div>

        <div className="demo-grid">
          {/* Phone mockup */}
          <div className="phone-card">
            <span className="phone-demo-badge"><span className="demo-dot" style={{ animation: "none" }} /> DEMO-GESPREK</span>

            {step === 0 && (
              <>
                <div className="caller-avatar"><PhoneCall size={26} /></div>
                <div className="caller-name">Nog geen gesprek</div>
                <div className="caller-sub">Start de demo om een inkomend gesprek te simuleren</div>
              </>
            )}

            {phoneRinging && (
              <>
                <div className="caller-avatar ringing"><PhoneIncoming size={26} /></div>
                <div className="caller-name">Onbekend mobiel nummer</div>
                <div className="caller-sub">Inkomend gesprek — VELRIX Demo Garage</div>
                <div className="call-status">● WORDT GEBELD</div>
              </>
            )}

            {phoneConnected && (
              <>
                <div className="caller-avatar"><Car size={26} /></div>
                <div className="caller-name">Klant — mobiel</div>
                <div className="caller-sub">Verbonden met digitale receptionist</div>
                <Waveform active={true} />
                <div className="call-timer">{timer.label}</div>
                <div className="call-btns"><span className="call-pill live"><Mic size={12} /> In gesprek</span></div>
              </>
            )}

            {callEnded && (
              <>
                <div className="caller-avatar"><Check size={26} /></div>
                <div className="caller-name">Gesprek afgerond</div>
                <div className="caller-sub">Duur: {timer.label || "0:41"}</div>
                <div className="call-btns"><span className="call-pill ended"><PhoneOff size={12} /> Opgehangen</span></div>
              </>
            )}
          </div>

          {/* Console */}
          <div className="console-card">
            <div className="console-head"><Sparkles size={13} /> VELRIX AI CONSOLE — LIVE TRANSCRIPT</div>

            <div className="transcript" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="transcript-empty">Het transcript van het gesprek verschijnt hier zodra de demo start.</div>
              )}
              {messages.map((m, i) => (
                <React.Fragment key={i}>
                  <div className={`bubble ${m.from === "ai" ? "bubble-ai" : "bubble-klant"}`}>{m.text}</div>
                  {m.intent && (
                    <div className="intent-chip"><Sparkles size={11} /> {m.intent}</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {step === 5 && (
              <div className="console-panel">
                <div className="panel-label">Beschikbare momenten — kies er één</div>
                <div className="slot-row">
                  {SLOTS.map((s) => (
                    <button key={s.id} className="slot-btn" onClick={() => pickSlot(s)}>
                      <span className="day">{s.day}</span>
                      <span className="time">{s.time}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step >= 7 && (
              <div className="console-panel">
                <div className="panel-label">Agenda — VELRIX Demo Garage</div>
                <div className="mini-cal">
                  {["Ma", "Di", "Wo", "Do", "Vr"].map((d, i) => {
                    const isBooked = d === "Wo" && slot;
                    return (
                      <div key={d} className={`mini-cal-day ${isBooked ? "booked" : ""}`}>
                        <div className="d">{d}</div>
                        <div className="n">{12 + i}</div>
                        {isBooked && <div className="booked-tag">APK {slot.time}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step >= 8 && (
              <div className="console-panel">
                <div className="panel-label">Bevestiging verstuurd</div>
                <div className="confirm-grid">
                  <div className="confirm-item"><div className="k">Klant</div><div className="v">{CUSTOMER_NAME}</div></div>
                  <div className="confirm-item"><div className="k">Kenteken</div><div className="v">{CUSTOMER_PLATE}</div></div>
                  <div className="confirm-item"><div className="k">Dienst</div><div className="v">APK-keuring</div></div>
                  <div className="confirm-item"><div className="k">Moment</div><div className="v">Woensdag {slot?.time}</div></div>
                </div>
                <div className="ping-row">
                  <span className="ping-item"><MessageCircle size={13} /> WhatsApp verstuurd</span>
                  <span className="ping-item"><Mail size={13} /> E-mail verstuurd</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button className="ctrl-btn" onClick={goBack} disabled={step === 0}>
              <ChevronLeft size={15} /> Vorige
            </button>
            {step === 0 ? (
              <button className="ctrl-btn primary" onClick={() => setStep(1)}>
                <PhoneIncoming size={15} /> Start demo
              </button>
            ) : (
              <button className="ctrl-btn primary" onClick={advance} disabled={isAtEnd || step === 5}>
                Volgende <ChevronRight size={15} />
              </button>
            )}
            <button className="ctrl-btn" onClick={() => setAutoplay((a) => !a)} disabled={step === 0 || isAtEnd}>
              {autoplay ? <Pause size={15} /> : <Play size={15} />} {autoplay ? "Pauzeer" : "Automatisch afspelen"}
            </button>
            <button className="ctrl-btn" onClick={reset}>
              <RotateCcw size={15} /> Opnieuw
            </button>
          </div>
          <span className="hint">
            {step === 5 ? "Kies een tijdstip om verder te gaan" : isAtEnd ? "Demo afgerond" : "Presenteer in eigen tempo, of laat automatisch afspelen"}
          </span>
        </div>

        {isAtEnd && (
          <div className="recap-card">
            <div className="recap-title">Wat de garagehouder net zag</div>
            <ul className="recap-list">
              <li><Check size={14} /> Geen gemiste oproep — ook buiten openingstijden</li>
              <li><Check size={14} /> Directe agendakoppeling, geen dubbel werk</li>
              <li><Check size={14} /> Automatische bevestiging per WhatsApp én e-mail</li>
              <li><Check size={14} /> Klinkt natuurlijk, in vloeiend Nederlands</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
