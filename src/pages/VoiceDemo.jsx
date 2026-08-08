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
} from "lucide-react";
import { useSpeech } from "../hooks/useSpeech.js";
import { nextTurn, DEMO_GARAGE, DEMO_SLOTS } from "../services/voiceEngine.js";

export default function VoiceDemo() {
  const speech = useSpeech({ lang: "nl-NL" });
  const [phase, setPhase] = useState("idle"); // idle | talking | ended
  const [step, setStep] = useState("greeting");
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [simulateClosed, setSimulateClosed] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [useTypedFallback, setUseTypedFallback] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const scrollRef = useRef(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!speech.supported) setUseTypedFallback(true);
  }, [speech.supported]);

  const addMessage = (from, text) => setMessages((m) => [...m, { from, text, id: `${from}-${Date.now()}-${Math.random()}` }]);

  const runAiTurn = async (nextStep, nextContext, aiText, slotsFlag) => {
    setShowSlots(Boolean(slotsFlag));
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
    handleUserText(text);
  };

  const handleUserText = (text) => {
    addMessage("user", text);
    const result = nextTurn({ step, context, userText: text });
    runAiTurn(result.nextStep, result.context, result.aiText, result.showSlots);
  };

  const startConversation = () => {
    runIdRef.current += 1;
    setMessages([]);
    setContext({ simulateClosed });
    setStep("greeting");
    setPhase("talking");
    setShowSlots(false);
    const result = nextTurn({ step: "greeting", context: { simulateClosed }, userText: "" });
    runAiTurn(result.nextStep, { simulateClosed, ...result.context }, result.aiText, result.showSlots);
  };

  const endConversation = () => {
    runIdRef.current += 1;
    speech.cancelSpeech();
    speech.stopListening();
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
  };

  const submitTyped = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTypedInput("");
    handleUserText(text);
  };

  const pickSlot = (slot) => {
    handleUserText(slot);
  };

  const micDisabled = phase !== "talking" || speech.speaking || speech.listening || useTypedFallback;

  return (
    <div className="voice-demo">
      <style>{`
        .voice-demo {
          --ink:#0a0b0d; --ink-2:#0e1013; --surface:#15171b; --border:#24272d; --border-strong:#34383f;
          --gold:#c9a668; --gold-bright:#e6cd94; --gold-dim:#8a733f; --text:#f3f1ec; --text-muted:#9a9c9f; --text-dim:#6b6d71; --green:#6fd18a;
          background: var(--ink); color: var(--text); min-height: 100vh; font-family:'Inter',ui-sans-serif,system-ui,sans-serif; -webkit-font-smoothing: antialiased;
        }
        .voice-demo h1, .voice-demo h2, .voice-demo h3 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; }
        .vd-wrap { max-width: 880px; margin:0 auto; padding: 20px 20px 64px; }
        .vd-back { display:inline-flex; align-items:center; gap:6px; color: var(--text-muted); font-size:13.5px; text-decoration:none; margin-bottom:18px; }
        .vd-back:hover { color: var(--text); }

        .vd-brand { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
        .vd-brand-mark { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; background: linear-gradient(150deg, var(--gold-bright), var(--gold-dim)); color:#16130a; }
        .vd-brand-word { font-family:'Fraunces',serif; font-weight:600; font-size:18px; }
        .vd-brand-suffix { font-family:'IBM Plex Mono',monospace; font-size:11px; color: var(--gold); border:1px solid var(--border-strong); border-radius:5px; padding:1px 7px; }

        .vd-banner { display:flex; align-items:center; gap:10px; border:1px solid var(--border-strong); background: rgba(201,166,104,.07); border-radius:12px; padding:12px 16px; font-size:13px; color: var(--text-muted); margin-bottom:22px; }
        .vd-banner strong { color: var(--gold-bright); }
        .vd-dot { width:7px; height:7px; border-radius:50%; background:#e6947a; box-shadow: 0 0 0 3px rgba(230,148,122,.2); flex-shrink:0; }

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

        .vd-start-btn { display:inline-flex; align-items:center; gap:9px; padding:15px 28px; border-radius:12px; border:none; cursor:pointer;
          background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:600; font-size:15.5px; width:100%; justify-content:center;
          transition: transform .2s ease, filter .2s; box-shadow: 0 16px 40px -16px rgba(201,166,104,.5); }
        .vd-start-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }

        .vd-console { border:1px solid var(--border); border-radius:20px; background: var(--surface); overflow:hidden; }
        .vd-console-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border); }
        .vd-console-title { display:flex; align-items:center; gap:8px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; color: var(--text-dim); letter-spacing:.04em; }
        .vd-console-title svg { color: var(--gold); }
        .vd-status-pill { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; padding:4px 10px; border-radius:999px; font-family:'IBM Plex Mono',monospace; }
        .vd-status-listening { color: var(--green); border:1px solid rgba(111,209,138,.35); background: rgba(111,209,138,.08); }
        .vd-status-speaking { color: var(--gold-bright); border:1px solid var(--border-strong); background: rgba(201,166,104,.08); }
        .vd-status-idle { color: var(--text-dim); border:1px solid var(--border-strong); }

        .vd-transcript { padding:20px; display:flex; flex-direction:column; gap:10px; max-height:400px; overflow-y:auto; }
        .vd-bubble { max-width:82%; padding:11px 15px; border-radius:14px; font-size:14px; line-height:1.55; }
        .vd-bubble-ai { align-self:flex-start; background: rgba(255,255,255,.05); border:1px solid var(--border-strong); border-bottom-left-radius:4px; }
        .vd-bubble-user { align-self:flex-end; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; font-weight:500; border-bottom-right-radius:4px; }
        .vd-bubble-system { align-self:center; font-size:12px; color: var(--text-dim); font-style:italic; }
        .vd-interim { align-self:flex-end; font-size:12.5px; color: var(--text-dim); font-style:italic; padding:0 4px; }

        .vd-slots { display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 16px; }
        .vd-slot-btn { padding:9px 16px; border-radius:10px; border:1px solid var(--border-strong); background: rgba(255,255,255,.02); color: var(--text); font-family:'IBM Plex Mono',monospace; font-size:13px; cursor:pointer; }
        .vd-slot-btn:hover { border-color: var(--gold-dim); background: rgba(201,166,104,.08); }

        .vd-controls { display:flex; align-items:center; justify-content:center; gap:16px; padding:22px 20px; border-top:1px solid var(--border); }
        .vd-mic-btn { width:64px; height:64px; border-radius:50%; border:2px solid var(--border-strong); background: rgba(255,255,255,.02);
          color: var(--text); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: all .2s ease; }
        .vd-mic-btn:hover:not(:disabled) { border-color: var(--gold-dim); }
        .vd-mic-btn.active { border-color: var(--green); box-shadow: 0 0 0 6px rgba(111,209,138,.15); animation: vd-pulse 1.4s ease-in-out infinite; }
        @keyframes vd-pulse { 0%,100% { box-shadow: 0 0 0 6px rgba(111,209,138,.15); } 50% { box-shadow: 0 0 0 12px rgba(111,209,138,.05); } }
        .vd-mic-btn:disabled { opacity:.4; cursor:not-allowed; }
        .vd-end-btn { width:52px; height:52px; border-radius:50%; border:1px solid rgba(230,148,122,.35); background: rgba(230,148,122,.08);
          color:#e6947a; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .vd-hint { text-align:center; font-size:12px; color: var(--text-dim); padding:0 20px 20px; }

        .vd-typed-row { display:flex; gap:8px; padding:0 20px 20px; }
        .vd-typed-input { flex:1; background: var(--ink-2); border:1px solid var(--border-strong); border-radius:10px; padding:11px 14px; font-size:14px; color: var(--text); outline:none; }
        .vd-typed-input:focus { border-color: var(--gold-dim); }
        .vd-typed-send { width:42px; border-radius:10px; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color:#17130a; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; }

        .vd-mode-switch { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 20px; border-top:1px solid var(--border); font-size:12px; color: var(--text-dim); }
        .vd-mode-switch button { background:none; border:none; color: var(--gold-bright); cursor:pointer; text-decoration:underline; font-size:12px; }

        .vd-end-card { border:1px solid var(--border); background: var(--surface); border-radius:20px; padding:32px; text-align:center; margin-top:22px; }
        .vd-end-badge { display:inline-flex; align-items:center; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:#e6947a; border:1px solid rgba(230,148,122,.35); background: rgba(230,148,122,.08); border-radius:999px; padding:5px 12px; margin-bottom:16px; }
        .vd-restart-btn { display:inline-flex; align-items:center; gap:8px; margin-top:18px; padding:12px 22px; border-radius:10px; border:1px solid var(--border-strong); background: rgba(255,255,255,.02); color: var(--text); cursor:pointer; font-size:14px; }
        .vd-restart-btn:hover { border-color: var(--gold-dim); }

        .vd-unsupported { font-size:12.5px; color: var(--text-dim); text-align:center; padding:14px 20px 0; }
      `}</style>

      <div className="vd-wrap">
        <Link to="/" className="vd-back"><ArrowLeft size={15} /> Terug naar velrix.nl</Link>

        <div className="vd-brand">
          <span className="vd-brand-mark"><Gauge size={16} strokeWidth={2} /></span>
          <span className="vd-brand-word">VELRIX</span>
          <span className="vd-brand-suffix">Voice AI</span>
        </div>

        <div className="vd-banner">
          <span className="vd-dot" />
          <span>
            <strong>VELRIX Voice AI — interactieve demo.</strong> Geen echte telefonische dienstverlening, geen echte
            afspraken, geen echte klantgegevens. Alles hieronder is test-/demodata voor {DEMO_GARAGE.name}.
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
              <div style={{ marginTop: 18 }}>
                <button className="vd-start-btn" onClick={startConversation}>
                  <Mic size={18} /> Start gesprek
                </button>
              </div>
              {!speech.supported && (
                <p className="vd-unsupported">
                  Uw browser ondersteunt geen spraakherkenning (dit werkt het best in Chrome of Edge). U kunt het
                  gesprek hieronder gewoon typen zodra u op start klikt.
                </p>
              )}
            </>
          )}
        </div>

        {phase !== "idle" && (
          <div className="vd-console">
            <div className="vd-console-head">
              <span className="vd-console-title"><Sparkles size={13} /> LIVE TRANSCRIPT</span>
              {speech.listening ? (
                <span className="vd-status-pill vd-status-listening"><Mic size={11} /> Luistert…</span>
              ) : speech.speaking ? (
                <span className="vd-status-pill vd-status-speaking"><Volume2 size={11} /> Spreekt…</span>
              ) : (
                <span className="vd-status-pill vd-status-idle">Wacht</span>
              )}
            </div>

            <div className="vd-transcript" ref={scrollRef}>
              {messages.map((m) => (
                <div key={m.id} className={`vd-bubble ${m.from === "ai" ? "vd-bubble-ai" : m.from === "user" ? "vd-bubble-user" : "vd-bubble-system"}`}>
                  {m.text}
                </div>
              ))}
              {speech.interimText && <div className="vd-interim">{speech.interimText}…</div>}
            </div>

            {showSlots && phase === "talking" && (
              <div className="vd-slots">
                {DEMO_SLOTS.map((s) => (
                  <button key={s} className="vd-slot-btn" onClick={() => pickSlot(s)}>{s}</button>
                ))}
              </div>
            )}

            {phase === "talking" && !useTypedFallback && (
              <>
                <div className="vd-controls">
                  <button
                    className={`vd-mic-btn ${speech.listening ? "active" : ""}`}
                    disabled={micDisabled && !speech.listening}
                    onClick={listenForUser}
                    aria-label="Spreek"
                  >
                    {speech.listening ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <button className="vd-end-btn" onClick={endConversation} aria-label="Beëindig gesprek"><PhoneOff size={20} /></button>
                </div>
                <p className="vd-hint">
                  {speech.speaking ? "Wacht tot de AI is uitgesproken…" : speech.listening ? "Spreek nu, of wacht tot het automatisch stopt." : "Klik op de microfoon om te antwoorden."}
                </p>
                <div className="vd-mode-switch">
                  <Keyboard size={13} /> Liever typen? <button onClick={() => setUseTypedFallback(true)}>Schakel over naar tekst</button>
                </div>
              </>
            )}

            {phase === "talking" && useTypedFallback && (
              <>
                <form className="vd-typed-row" onSubmit={submitTyped}>
                  <input className="vd-typed-input" value={typedInput} onChange={(e) => setTypedInput(e.target.value)} placeholder="Typ uw antwoord…" autoFocus />
                  <button type="submit" className="vd-typed-send" aria-label="Verstuur"><Send size={16} /></button>
                </form>
                <div className="vd-controls" style={{ paddingTop: 0 }}>
                  <button className="vd-end-btn" onClick={endConversation} aria-label="Beëindig gesprek"><PhoneOff size={20} /></button>
                </div>
              </>
            )}
          </div>
        )}

        {phase === "ended" && (
          <div className="vd-end-card">
            <span className="vd-end-badge">TEST — geen echte afspraak</span>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Gesprek afgerond</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 8, lineHeight: 1.6 }}>
              Dit was een demo-gesprek met test-/voorbeelddata. Er is geen echte afspraak, geen echt telefoonnummer en
              geen echte klantdata bij betrokken.
            </p>
            <button className="vd-restart-btn" onClick={resetConversation}><RotateCcw size={15} /> Nieuw gesprek starten</button>
          </div>
        )}
      </div>
    </div>
  );
}
