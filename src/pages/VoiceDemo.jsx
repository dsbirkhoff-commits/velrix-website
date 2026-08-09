import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  Gauge,
  Sparkles,
  RotateCcw,
  Volume2,
  Keyboard,
  Send,
  Wrench,
  Clock,
  Loader2,
  Check,
  ShieldAlert,
} from "lucide-react";
import { useSpeech } from "../hooks/useSpeech.js";
import { nextTurn, DEMO_GARAGE, DEMO_SLOTS } from "../services/voiceEngine.js";

// Small artificial delay so "Denkt..." is visible and the pacing feels like
// a real conversation instead of instant, robotic replies. Purely cosmetic.
const THINKING_DELAY_MS = 550;

function Waveform({ active }) {
  return (
    <div className="vd-wave" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="vd-wave-bar" style={{ "--i": i, animationPlayState: active ? "running" : "paused" }} />
      ))}
    </div>
  );
}

export default function VoiceDemo() {
  const speech = useSpeech({ lang: "nl-NL" });
  const [phase, setPhase] = useState("idle"); // idle | requesting-permission | talking | ended
  const [step, setStep] = useState("greeting");
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [simulateClosed, setSimulateClosed] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [useTypedFallback, setUseTypedFallback] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [demoBooking, setDemoBooking] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const scrollRef = useRef(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!speech.supported) setUseTypedFallback(true);
  }, [speech.supported]);

  const addMessage = (from, text) => setMessages((m) => [...m, { from, text, id: `${from}-${Date.now()}-${Math.random()}` }]);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const runAiTurn = async (nextStep, nextContext, aiText, slotsFlag, booking) => {
    setShowSlots(Boolean(slotsFlag));
    if (booking) setDemoBooking(booking);
    addMessage("ai", aiText);
    setStep(nextStep);
    if (nextContext) setContext(nextContext);
    await speech.speak(aiText);
    if (nextStep === "confirmed") {
      setPhase("ended");
      return;
    }
    await listenForUser();
  };

  const listenForUser = async () => {
    if (useTypedFallback) return; // wait for typed submit instead
    const myRun = runIdRef.current;
    const text = await speech.listenOnce();
    if (runIdRef.current !== myRun) return; // conversation was reset/ended meanwhile
    if (!text) {
      addMessage("system", "Ik heb niets gehoord. Klik op de microfoon om het nogmaals te proberen, of typ uw antwoord.");
      return;
    }
    await handleUserText(text);
  };

  const handleUserText = async (text) => {
    const myRun = runIdRef.current;
    addMessage("user", text);
    setThinking(true);
    await wait(THINKING_DELAY_MS); // visible "Denkt..." beat
    if (runIdRef.current !== myRun) return;
    setThinking(false);
    const result = nextTurn({ step, context, userText: text });
    await runAiTurn(result.nextStep, result.context, result.aiText, result.showSlots, result.demoBooking);
  };

  const startConversation = async () => {
    runIdRef.current += 1;
    setMessages([]);
    setDemoBooking(null);
    setPermissionError(null);
    setContext({ simulateClosed });
    setStep("greeting");
    setShowSlots(false);

    if (speech.supported && !useTypedFallback) {
      setPhase("requesting-permission");
      try {
        // Explicit, visible permission step. SpeechRecognition.start() would
        // also trigger this prompt, but asking up front lets us show a
        // clear "microfoon aanvragen" state and fail gracefully.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // we only needed the permission, not the stream
      } catch {
        setPermissionError("Microfoontoegang geweigerd of niet beschikbaar. U kunt de demo hieronder gewoon typen.");
        setUseTypedFallback(true);
      }
    }

    setPhase("talking");
    const result = nextTurn({ step: "greeting", context: { simulateClosed }, userText: "" });
    await runAiTurn(result.nextStep, { simulateClosed, ...result.context }, result.aiText, result.showSlots, result.demoBooking);
  };

  const endConversation = () => {
    runIdRef.current += 1;
    speech.cancelSpeech();
    speech.stopListening();
    setThinking(false);
    setPhase("ended");
  };

  const resetConversation = () => {
    runIdRef.current += 1;
    speech.cancelSpeech();
    speech.stopListening();
    setPhase("idle");
    setMessages([]);
    setStep("greeting");
    setContext({});
    setShowSlots(false);
    setTypedInput("");
    setThinking(false);
    setDemoBooking(null);
    setPermissionError(null);
  };

  const submitTyped = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTypedInput("");
    handleUserText(text);
  };

  const pickSlot = (slot) => handleUserText(slot);

  const statusLabel = thinking
    ? "Denkt..."
    : speech.listening
    ? "Luistert..."
    : speech.speaking
    ? "Spreekt..."
    : phase === "requesting-permission"
    ? "Microfoon aanvragen..."
    : phase === "talking"
    ? "Wacht"
    : "Klaar om te bellen";

  const micBusy = thinking || speech.speaking || speech.listening || phase !== "talking";

  return (
    <div className="voice-demo">
      <style>{`
        .voice-demo {
          --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71; --green:#6fd18a; --red:#e6947a;
          background: var(--ink); color: var(--text); min-height: 100vh; font-family:'Inter',ui-sans-serif,system-ui,sans-serif; -webkit-font-smoothing: antialiased;
        }
        .voice-demo h1, .voice-demo h2, .voice-demo h3 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .vd-wrap { max-width: 880px; margin:0 auto; padding: 20px 20px 64px; }
        .vd-back { display:inline-flex; align-items:center; gap:6px; color: var(--text-muted); font-size:13.5px; text-decoration:none; margin-bottom:18px; }
        .vd-back:hover { color: var(--text); }

        .vd-brand { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
        .vd-brand-mark { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; background: linear-gradient(150deg, var(--gold-bright), var(--gold-dim)); color:#16130a; }
        .vd-brand-word { font-family:'Fraunces',serif; font-weight:600; font-size:18px; }
        .vd-brand-suffix { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--gold); border:1px solid var(--border-strong); border-radius:5px; padding:1px 7px; }
        .vd-page-title { font-size: clamp(1.5rem, 3vw, 1.9rem); font-weight:500; margin: 6px 0 4px; }
        .vd-page-sub { font-size:13px; color: var(--text-dim); margin-bottom:20px; }

        .vd-banner { display:flex; align-items:center; gap:10px; border:1px solid var(--border-strong); background: rgba(201,166,104,.07); border-radius:12px; padding:12px 16px; font-size:13px; color: var(--text-muted); margin-bottom:22px; }
        .vd-banner strong { color: var(--gold-bright); }
        .vd-dot { width:7px; height:7px; border-radius:50%; background: var(--red); box-shadow: 0 0 0 3px rgba(230,148,122,.2); flex-shrink:0; }

        .vd-garage-card { border:1px solid var(--border); background: var(--surface); border-radius:16px; padding:22px 24px; margin-bottom:22px; }
        .vd-garage-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:600; }
        .vd-garage-title svg { color: var(--gold); }
        .vd-garage-row { display:flex; align-items:center; gap:8px; font-size:13px; color: var(--text-muted); margin-top:10px; }
        .vd-garage-row svg { color: var(--gold-dim); flex-shrink:0; }
        .vd-services { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
        .vd-service-pill { font-size:11.5px; padding:4px 10px; border-radius:999px; border:1px solid var(--border-strong); color: var(--text-muted); }

        .vd-toggle-row { display:flex; align-items:center; gap:10px; margin-top:16px; padding-top:16px; border-top:1px solid var(--border); }
        .vd-toggle { position:relative; width:38px; height:22px; border-radius:999px; border:1px solid var(--border-strong); background: rgba(255,255,255,.02); cursor:pointer; flex-shrink:0; }
        .vd-toggle.on { background: linear-gradient(150deg, var(--gold-bright), var(--gold)); border-color: transparent; }
        .vd-toggle-knob { position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#f3f1ec; transition: transform .2s ease; }
        .vd-toggle.on .vd-toggle-knob { transform: translateX(16px); background:#17130a; }
        .vd-toggle-label { font-size:12.5px; color: var(--text-muted); }

        .vd-ready-row { display:flex; align-items:center; gap:8px; margin-top:16px; font-family:'IBM Plex Mono',monospace; font-size:12px; color: var(--text-dim); }
        .vd-ready-dot { width:7px; height:7px; border-radius:50%; background: var(--text-dim); }

        .vd-start-btn { display:inline-flex; align-items:center; gap:9px; padding:15px 28px; border-radius:12px; border:none; cursor:pointer;
          background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:15.5px; width:100%; justify-content:center;
          transition: transform .2s ease, filter .2s; box-shadow: 0 16px 40px -16px rgba(201,166,104,.5); margin-top:14px; }
        .vd-start-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .vd-start-btn:disabled { opacity:.6; cursor:wait; transform:none; }

        .vd-permission-error { display:flex; align-items:flex-start; gap:8px; margin-top:14px; padding:12px 14px; border-radius:10px; border:1px solid rgba(230,148,122,.35); background: rgba(230,148,122,.08); color:#f0c4b8; font-size:12.5px; line-height:1.5; }
        .vd-permission-error svg { flex-shrink:0; margin-top:1px; color: var(--red); }

        .vd-console { border:1px solid var(--border); border-radius:20px; background: var(--surface); overflow:hidden; }
        .vd-console-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); gap:10px; flex-wrap:wrap; }
        .vd-console-title { display:flex; align-items:center; gap:8px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; color: var(--text-dim); letter-spacing:.04em; }
        .vd-console-title svg { color: var(--gold); }
        .vd-status-pill { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; padding:4px 10px; border-radius:999px; font-family:'IBM Plex Mono',monospace; }
        .vd-status-listening { color: var(--green); border:1px solid rgba(111,209,138,.35); background: rgba(111,209,138,.08); }
        .vd-status-speaking { color: var(--gold-bright); border:1px solid var(--border-strong); background: rgba(201,166,104,.08); }
        .vd-status-thinking { color: var(--text-muted); border:1px solid var(--border-strong); background: rgba(255,255,255,.03); }
        .vd-status-idle { color: var(--text-dim); border:1px solid var(--border-strong); }
        .vd-status-dot { width:6px; height:6px; border-radius:50%; background: currentColor; }

        .vd-wave { display:flex; align-items:center; gap:3px; height:22px; padding: 0 20px 4px; }
        .vd-wave-bar { width:3px; border-radius:3px; background: linear-gradient(180deg, var(--gold-bright), var(--gold-dim)); height:5px; animation: vd-wavebounce 1s ease-in-out infinite; animation-delay: calc(var(--i) * 0.05s); }
        @keyframes vd-wavebounce { 0%,100% { height:4px; opacity:.4; } 50% { height:20px; opacity:1; } }

        .vd-transcript { padding:16px 20px; display:flex; flex-direction:column; gap:10px; max-height:380px; overflow-y:auto; }
        .vd-bubble { max-width:82%; padding:11px 15px; border-radius:14px; font-size:14px; line-height:1.55; }
        .vd-bubble-ai { align-self:flex-start; background: rgba(255,255,255,.05); border:1px solid var(--border-strong); border-bottom-left-radius:4px; }
        .vd-bubble-user { align-self:flex-end; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:500; border-bottom-right-radius:4px; }
        .vd-bubble-system { align-self:center; font-size:12px; color: var(--text-dim); font-style:italic; }
        .vd-interim { align-self:flex-end; font-size:12.5px; color: var(--text-dim); font-style:italic; padding:0 4px; }
        .vd-thinking-bubble { align-self:flex-start; display:flex; gap:4px; padding:11px 15px; border-radius:14px; background: rgba(255,255,255,.05); border:1px solid var(--border-strong); border-bottom-left-radius:4px; }
        .vd-thinking-bubble span { width:5px; height:5px; border-radius:50%; background: var(--text-dim); animation: vd-dotbounce 1.2s infinite ease-in-out; }
        .vd-thinking-bubble span:nth-child(2) { animation-delay:.15s; } .vd-thinking-bubble span:nth-child(3) { animation-delay:.3s; }
        @keyframes vd-dotbounce { 0%,60%,100% { transform: translateY(0); opacity:.5; } 30% { transform: translateY(-4px); opacity:1; } }

        .vd-slots { display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 16px; }
        .vd-slot-btn { padding:9px 16px; border-radius:10px; border:1px solid var(--border-strong); background: rgba(255,255,255,.02); color: var(--text); font-family:'IBM Plex Mono',monospace; font-size:13px; cursor:pointer; }
        .vd-slot-btn:hover { border-color: var(--gold-dim); background: rgba(201,166,104,.08); }

        .vd-controls { display:flex; align-items:center; justify-content:center; gap:16px; padding:20px; border-top:1px solid var(--border); flex-wrap:wrap; }
        .vd-mic-btn { width:64px; height:64px; border-radius:50%; border:2px solid var(--border-strong); background: rgba(255,255,255,.02);
          color: var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: all .2s ease; }
        .vd-mic-btn:hover:not(:disabled) { border-color: var(--gold-dim); }
        .vd-mic-btn.active { border-color: var(--green); box-shadow: 0 0 0 6px rgba(111,209,138,.15); animation: vd-pulse 1.4s ease-in-out infinite; }
        @keyframes vd-pulse { 0%,100% { box-shadow: 0 0 0 6px rgba(111,209,138,.15); } 50% { box-shadow: 0 0 0 12px rgba(111,209,138,.05); } }
        .vd-mic-btn:disabled { opacity:.4; cursor:not-allowed; }
        .vd-text-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 18px; border-radius:10px; border:1px solid rgba(230,148,122,.35); background: rgba(230,148,122,.08); color:#f0c4b8; cursor:pointer; font-size:13.5px; font-weight:500; }
        .vd-text-btn:hover { background: rgba(230,148,122,.14); }
        .vd-hint { text-align:center; font-size:12px; color: var(--text-dim); padding:0 20px 16px; }

        .vd-typed-row { display:flex; gap:8px; padding:0 20px 20px; }
        .vd-typed-input { flex:1; background: var(--ink-2); border:1px solid var(--border-strong); border-radius:10px; padding:11px 14px; font-size:14px; color: var(--text); outline:none; }
        .vd-typed-input:focus { border-color: var(--gold-dim); }
        .vd-typed-send { width:42px; border-radius:10px; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; }

        .vd-mode-switch { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 20px; border-top:1px solid var(--border); font-size:12px; color: var(--text-dim); }
        .vd-mode-switch button { background:none; border:none; color: var(--gold-bright); cursor:pointer; text-decoration:underline; font-size:12px; padding:0; }

        .vd-booking-card { margin: 0 20px 18px; border:1px dashed var(--border-strong); border-radius:14px; padding:18px 20px; background: rgba(201,166,104,.04); }
        .vd-booking-badge { display:inline-flex; align-items:center; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.06em; color: var(--gold-bright); border:1px solid var(--border-strong); background: rgba(201,166,104,.1); border-radius:999px; padding:4px 11px; margin-bottom:12px; }
        .vd-booking-grid { display:grid; grid-template-columns: 1fr 1fr; gap:8px 16px; }
        .vd-booking-item .k { font-size:10.5px; color: var(--text-dim); } .vd-booking-item .v { font-size:13.5px; color: var(--text); margin-top:2px; font-weight:500; }
        .vd-booking-note { font-size:11px; color: var(--text-dim); margin-top:14px; }

        .vd-end-card { border:1px solid var(--border); background: var(--surface); border-radius:20px; padding:32px; text-align:center; margin-top:22px; }
        .vd-restart-btn { display:inline-flex; align-items:center; gap:8px; margin-top:18px; padding:12px 22px; border-radius:10px; border:1px solid var(--border-strong); background: rgba(255,255,255,.02); color: var(--text); cursor:pointer; font-size:14px; }
        .vd-restart-btn:hover { border-color: var(--gold-dim); }

        .vd-unsupported { font-size:12.5px; color: var(--text-dim); text-align:center; padding:14px 0 0; }
        .animate-spin { animation: vd-spin 1s linear infinite; }
        @keyframes vd-spin { to { transform: rotate(360deg); } }

        @media (max-width:480px) { .vd-booking-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="vd-wrap">
        <Link to="/" className="vd-back"><ArrowLeft size={15} /> Terug naar velrix.nl</Link>

        <div className="vd-brand">
          <span className="vd-brand-mark"><Gauge size={16} strokeWidth={2} /></span>
          <span className="vd-brand-word">VELRIX</span>
          <span className="vd-brand-suffix">Voice AI</span>
        </div>
        <h1 className="vd-page-title">VELRIX Voice AI — interactieve demo</h1>
        <p className="vd-page-sub">Deze demo simuleert een AI-receptionist. Er worden geen echte telefoongesprekken of afspraken gemaakt.</p>

        <div className="vd-banner">
          <span className="vd-dot" />
          <span>
            <strong>Alleen demo.</strong> Geen echte telefonische dienstverlening, geen echte afspraken, geen echte
            klantgegevens — uitsluitend test-/demodata voor {DEMO_GARAGE.name}.
          </span>
        </div>

        <div className="vd-garage-card">
          <div className="vd-garage-title"><Wrench size={16} /> {DEMO_GARAGE.name}</div>
          <div className="vd-garage-row"><Clock size={14} /> Ma–vr 08:00–17:30 · za 09:00–14:00 · zo gesloten</div>
          <div className="vd-services">
            {DEMO_GARAGE.services.map((s) => (<span className="vd-service-pill" key={s}>{s}</span>))}
          </div>

          {phase === "idle" && (
            <>
              <div className="vd-toggle-row">
                <div className={`vd-toggle ${simulateClosed ? "on" : ""}`} onClick={() => setSimulateClosed((v) => !v)}>
                  <div className="vd-toggle-knob" />
                </div>
                <span className="vd-toggle-label">Simuleer: werkplaats is nu gesloten (voor demo-doeleinden)</span>
              </div>

              <div className="vd-ready-row"><span className="vd-ready-dot" /> Klaar om te bellen</div>

              <button className="vd-start-btn" onClick={startConversation}>
                <Mic size={18} /> Start Voice Demo
              </button>

              {!speech.supported && (
                <p className="vd-unsupported">
                  Voice input wordt niet ondersteund in deze browser (dit werkt het best in Chrome of Edge). Gebruik
                  tekstinvoer om de demo te testen — die verschijnt automatisch zodra u start.
                </p>
              )}
            </>
          )}

          {phase === "requesting-permission" && (
            <div className="vd-permission-error" style={{ borderColor: "var(--border-strong)", background: "rgba(255,255,255,.03)", color: "var(--text-muted)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span>Microfoontoegang aanvragen bij de browser…</span>
            </div>
          )}

          {permissionError && (
            <div className="vd-permission-error"><ShieldAlert size={15} /> {permissionError}</div>
          )}
        </div>

        {(phase === "talking" || phase === "ended") && (
          <div className="vd-console">
            <div className="vd-console-head">
              <span className="vd-console-title"><Sparkles size={13} /> LIVE TRANSCRIPT</span>
              <span
                className={`vd-status-pill ${
                  thinking ? "vd-status-thinking" : speech.listening ? "vd-status-listening" : speech.speaking ? "vd-status-speaking" : "vd-status-idle"
                }`}
              >
                <span className="vd-status-dot" /> {statusLabel}
              </span>
            </div>

            {(speech.listening || speech.speaking) && <Waveform active={true} />}

            <div className="vd-transcript" ref={scrollRef}>
              {messages.map((m) => (
                <div key={m.id} className={`vd-bubble ${m.from === "ai" ? "vd-bubble-ai" : m.from === "user" ? "vd-bubble-user" : "vd-bubble-system"}`}>
                  {m.text}
                </div>
              ))}
              {speech.interimText && <div className="vd-interim">{speech.interimText}…</div>}
              {thinking && <div className="vd-thinking-bubble"><span /><span /><span /></div>}
            </div>

            {showSlots && phase === "talking" && (
              <div className="vd-slots">
                {DEMO_SLOTS.map((s) => (
                  <button key={s} className="vd-slot-btn" onClick={() => pickSlot(s)}>{s}</button>
                ))}
              </div>
            )}

            {demoBooking && (
              <div className="vd-booking-card">
                <span className="vd-booking-badge"><Check size={11} /> DEMO-AFSPRAAK</span>
                <div className="vd-booking-grid">
                  <div className="vd-booking-item"><div className="k">Dienst</div><div className="v">{demoBooking.service}</div></div>
                  <div className="vd-booking-item"><div className="k">Moment</div><div className="v">{demoBooking.slot || "—"}</div></div>
                  <div className="vd-booking-item" style={{ gridColumn: "1 / -1" }}><div className="k">Naam / kenteken</div><div className="v">{demoBooking.namePlate}</div></div>
                </div>
                <p className="vd-booking-note">Dit is uitsluitend een demo-weergave. Er is geen echte afspraak in Google Calendar of enig ander systeem aangemaakt.</p>
              </div>
            )}

            {phase === "talking" && !useTypedFallback && (
              <>
                <div className="vd-controls">
                  <button className={`vd-mic-btn ${speech.listening ? "active" : ""}`} disabled={micBusy && !speech.listening} onClick={listenForUser} aria-label="Spreek">
                    {speech.listening ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <button className="vd-text-btn" onClick={endConversation}><PhoneOff size={16} /> Gesprek beëindigen</button>
                </div>
                <p className="vd-hint">
                  {speech.speaking ? "Wacht tot VELRIX is uitgesproken…" : thinking ? "Even geduld…" : speech.listening ? "Spreek nu, of wacht tot het automatisch stopt." : "Klik op de microfoon om te antwoorden."}
                </p>
                <div className="vd-mode-switch">
                  <Keyboard size={13} /> Liever typen? <button onClick={() => setUseTypedFallback(true)}>Schakel over naar tekst</button>
                </div>
              </>
            )}

            {phase === "talking" && useTypedFallback && (
              <>
                <form className="vd-typed-row" onSubmit={submitTyped}>
                  <input className="vd-typed-input" value={typedInput} onChange={(e) => setTypedInput(e.target.value)} placeholder="Typ hier wat u tegen de receptionist wilt zeggen..." autoFocus disabled={thinking || speech.speaking} />
                  <button type="submit" className="vd-typed-send" aria-label="Verstuur" disabled={thinking || speech.speaking}><Send size={16} /></button>
                </form>
                <div className="vd-controls" style={{ paddingTop: 0 }}>
                  <button className="vd-text-btn" onClick={endConversation}><PhoneOff size={16} /> Gesprek beëindigen</button>
                </div>
              </>
            )}

            {phase === "ended" && (
              <div className="vd-controls" style={{ borderTop: "none" }}>
                <button className="vd-restart-btn" onClick={resetConversation}><RotateCcw size={15} /> Opnieuw starten</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
