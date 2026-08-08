import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check, Loader2, CalendarClock, Sparkles, ExternalLink } from "lucide-react";
import { getAvailability, createBooking, bookingMeta } from "../services/calendarService.js";

const STEPS = ["Datum", "Tijd", "Gegevens", "Bevestigen"];

function nextBusinessDays(count) {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // start morgen
  while (days.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d) {
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

export default function BookingModal({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null); // Date
  const [selectedTime, setSelectedTime] = useState(null); // "HH:MM"
  const [slots, setSlots] = useState([]);
  const [slotsSource, setSlotsSource] = useState(null); // "mock" | "google-calendar"
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { source, confirmationId, htmlLink }
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);

  const days = useMemo(() => nextBusinessDays(10), []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pickDate = async (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await getAvailability(toISODate(date));
      setSlots(res.slots);
      setSlotsSource(res.source);
    } finally {
      setLoadingSlots(false);
      setStepIndex(1);
    }
  };

  const pickTime = (time) => {
    setSelectedTime(time);
    setStepIndex(2);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createBooking({
        dateISO: toISODate(selectedDate),
        time: selectedTime,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });
      setResult(res);
      setStepIndex(4);
    } catch (e) {
      setError("Er ging iets mis bij het bevestigen. Probeer het nog eens.");
    } finally {
      setSubmitting(false);
    }
  };

  const canGoDetails = form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);

  return (
    <div className="bk-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <style>{`
        .bk-overlay { position:fixed; inset:0; z-index:200; background: rgba(6,7,8,.72); backdrop-filter: blur(6px);
          display:flex; align-items:center; justify-content:center; padding:20px; animation: bk-fade .25s ease; }
        @keyframes bk-fade { from { opacity:0; } to { opacity:1; } }
        .bk-modal { width:100%; max-width:560px; max-height:92vh; overflow-y:auto; border-radius:22px;
          background: linear-gradient(180deg, #15171b, #101216); border:1px solid #2a2d33;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,.7); animation: bk-rise .35s cubic-bezier(.22,1,.36,1);
          font-family:'Inter',ui-sans-serif,system-ui,sans-serif; color:#f3f1ec; position:relative; }
        @keyframes bk-rise { from { opacity:0; transform: translateY(24px) scale(.98); } to { opacity:1; transform: translateY(0) scale(1); } }
        .bk-modal h1, .bk-modal h2, .bk-modal h3 { font-family:'Fraunces',ui-serif,Georgia,serif; letter-spacing:-.01em; margin:0; }
        .bk-head { padding:24px 26px 0; }
        .bk-close { position:absolute; top:18px; right:18px; width:34px; height:34px; border-radius:10px; border:1px solid #34383f;
          background: rgba(255,255,255,.03); color:#9a9c9f; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .bk-close:hover { color:#f3f1ec; border-color:#8a733f; }
        .bk-eyebrow { display:inline-flex; align-items:center; gap:7px; font-family:'IBM Plex Mono',monospace; font-size:11.5px;
          letter-spacing:.05em; color:#e6cd94; border:1px solid #34383f; background: rgba(201,166,104,.08); padding:5px 12px; border-radius:999px; }
        .bk-title { font-size:22px; font-weight:500; margin-top:14px; }
        .bk-sub { font-size:13.5px; color:#9a9c9f; margin-top:6px; line-height:1.55; }
        .bk-agenda-note { display:flex; align-items:center; gap:7px; font-size:12px; color:#8a733f; margin-top:12px; }

        .bk-progress { display:flex; gap:6px; padding:18px 26px 0; }
        .bk-progress-seg { flex:1; height:3px; border-radius:99px; background:#24272d; overflow:hidden; }
        .bk-progress-seg-fill { height:100%; background: linear-gradient(90deg, #e6cd94, #c9a668); transition: width .4s ease; }

        .bk-body { padding:22px 26px 26px; }

        .bk-days { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; margin-top:4px; }
        .bk-day { flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:3px; min-width:64px; padding:12px 8px;
          border-radius:12px; border:1px solid #34383f; background: rgba(255,255,255,.02); color:#9a9c9f; cursor:pointer; transition: all .2s ease; }
        .bk-day:hover { border-color:#8a733f; color:#f3f1ec; }
        .bk-day.active { border-color:#c9a668; background: rgba(201,166,104,.12); color:#e6cd94; }
        .bk-day-dow { font-size:10.5px; text-transform:capitalize; } .bk-day-date { font-size:14px; font-weight:600; font-family:'IBM Plex Mono',monospace; }

        .bk-slots { display:grid; grid-template-columns: repeat(3, 1fr); gap:9px; margin-top:6px; max-height:280px; overflow-y:auto; }
        .bk-slot { padding:11px 6px; text-align:center; border-radius:10px; border:1px solid #34383f; background: rgba(255,255,255,.02);
          color:#f3f1ec; font-family:'IBM Plex Mono',monospace; font-size:13.5px; cursor:pointer; transition: all .2s ease; }
        .bk-slot:hover { border-color:#8a733f; background: rgba(201,166,104,.08); }
        .bk-slot.active { border-color:#c9a668; background: linear-gradient(150deg,#e6cd94,#c9a668); color:#17130a; font-weight:600; }
        .bk-empty { text-align:center; padding:40px 10px; color:#6b6d71; font-size:13.5px; }

        .bk-badge-row { display:flex; justify-content:center; margin-top:14px; }
        .bk-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; padding:5px 12px; border-radius:999px; font-family:'IBM Plex Mono',monospace; text-align:center; }
        .bk-badge-mock { color:#e6947a; border:1px solid rgba(230,148,122,.35); background: rgba(230,148,122,.08); }
        .bk-badge-real { color:#6fd18a; border:1px solid rgba(111,209,138,.35); background: rgba(111,209,138,.08); }

        .bk-field { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .bk-label { font-size:12px; color:#6b6d71; } .bk-label span { color:#e6947a; }
        .bk-input { background:#0e1013; border:1px solid #34383f; border-radius:10px; padding:12px 14px; font-size:14.5px; color:#f3f1ec; outline:none; font-family:inherit; width:100%; }
        .bk-input:focus { border-color:#8a733f; box-shadow: 0 0 0 3px rgba(201,166,104,.12); }

        .bk-summary { border:1px solid #34383f; border-radius:14px; padding:18px; background: rgba(255,255,255,.02); margin-bottom:18px; }
        .bk-summary-row { display:flex; justify-content:space-between; font-size:13.5px; padding:7px 0; border-bottom:1px solid #24272d; gap:12px; }
        .bk-summary-row:last-child { border-bottom:none; }
        .bk-summary-row .k { color:#6b6d71; flex-shrink:0; } .bk-summary-row .v { color:#f3f1ec; font-weight:500; text-align:right; }

        .bk-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:22px; }
        .bk-back { display:inline-flex; align-items:center; gap:6px; font-size:13.5px; color:#9a9c9f; background:none; border:none; cursor:pointer; padding:8px 4px; }
        .bk-back:hover { color:#f3f1ec; }
        .bk-primary { display:inline-flex; align-items:center; gap:8px; padding:13px 22px; border-radius:10px; border:none; cursor:pointer;
          background: linear-gradient(150deg,#e6cd94,#c9a668); color:#17130a; font-weight:600; font-size:14.5px; transition: transform .2s ease, filter .2s; margin-left:auto; }
        .bk-primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .bk-primary:disabled { opacity:.4; cursor:not-allowed; transform:none; }

        .bk-success { text-align:center; padding:10px 0 4px; }
        .bk-success-icon { width:56px; height:56px; border-radius:50%; margin:0 auto 18px; display:flex; align-items:center; justify-content:center;
          background: rgba(201,166,104,.12); border:1px solid #8a733f; color:#e6cd94; }
        .bk-success-detail { font-size:13.5px; color:#9a9c9f; margin-top:8px; line-height:1.6; }
        .bk-cal-link { display:inline-flex; align-items:center; gap:6px; margin-top:16px; font-size:13px; color:#e6cd94; text-decoration:none; }
        .bk-error { color:#e6947a; font-size:13px; margin-top:10px; text-align:center; }
        .animate-spin { animation: bk-spin 1s linear infinite; }
        @keyframes bk-spin { to { transform: rotate(360deg); } }

        @media (max-width:480px) { .bk-slots { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="bk-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Plan een gesprek">
        <button className="bk-close" onClick={onClose} aria-label="Sluiten"><X size={18} /></button>

        <div className="bk-head">
          <span className="bk-eyebrow"><Sparkles size={12} /> {bookingMeta.title} — {bookingMeta.durationMinutes} minuten</span>
          <h2 className="bk-title">
            {stepIndex === 0 && "Kies een datum"}
            {stepIndex === 1 && "Kies een tijd"}
            {stepIndex === 2 && "Uw gegevens"}
            {stepIndex === 3 && "Even controleren"}
            {stepIndex === 4 && "Afspraak bevestigd"}
          </h2>
          {stepIndex < 4 && (
            <>
              <p className="bk-sub">Vrijblijvend kennismakingsgesprek van 30 minuten met VELRIX.</p>
              <div className="bk-agenda-note"><CalendarClock size={13} /> Beschikbare tijden worden automatisch aangepast aan mijn agenda.</div>
            </>
          )}
        </div>

        {stepIndex < 4 && (
          <div className="bk-progress">
            {STEPS.map((s, i) => (
              <div className="bk-progress-seg" key={s}>
                <div className="bk-progress-seg-fill" style={{ width: i <= stepIndex ? "100%" : "0%" }} />
              </div>
            ))}
          </div>
        )}

        <div className="bk-body">
          {/* Step 0: date */}
          {stepIndex === 0 && (
            <div className="bk-days">
              {days.map((d) => (
                <div key={d.toISOString()} className={`bk-day ${selectedDate && toISODate(selectedDate) === toISODate(d) ? "active" : ""}`} onClick={() => pickDate(d)}>
                  <span className="bk-day-dow">{formatDateLabel(d).split(" ")[0]}</span>
                  <span className="bk-day-date">{d.getDate()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: time */}
          {stepIndex === 1 && (
            <>
              {loadingSlots ? (
                <div className="bk-empty"><Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 10px" }} /><br />Beschikbaarheid ophalen…</div>
              ) : slots.length === 0 ? (
                <div className="bk-empty">Geen beschikbare tijden op deze dag. Kies een andere datum.</div>
              ) : (
                <div className="bk-slots">
                  {slots.map((t) => (
                    <div key={t} className={`bk-slot ${selectedTime === t ? "active" : ""}`} onClick={() => pickTime(t)}>{t}</div>
                  ))}
                </div>
              )}
              <div className="bk-badge-row">
                {slotsSource === "mock" ? (
                  <span className="bk-badge bk-badge-mock">Demo-modus — voorbeeldbeschikbaarheid, nog geen live Google Calendar-koppeling</span>
                ) : slotsSource === "google-calendar" ? (
                  <span className="bk-badge bk-badge-real"><Check size={11} /> Live gekoppeld aan Google Calendar</span>
                ) : null}
              </div>
              <div className="bk-footer">
                <button className="bk-back" onClick={() => setStepIndex(0)}><ChevronLeft size={15} /> Andere datum</button>
              </div>
            </>
          )}

          {/* Step 2: details */}
          {stepIndex === 2 && (
            <>
              <div className="bk-field">
                <label className="bk-label" htmlFor="bk-name">Naam<span>*</span></label>
                <input id="bk-name" className="bk-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Uw volledige naam" />
              </div>
              <div className="bk-field">
                <label className="bk-label" htmlFor="bk-email">E-mailadres<span>*</span></label>
                <input id="bk-email" type="email" className="bk-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="naam@garage.nl" />
              </div>
              <div className="bk-field">
                <label className="bk-label" htmlFor="bk-phone">Telefoonnummer (optioneel)</label>
                <input id="bk-phone" className="bk-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 12345678" />
              </div>
              <div className="bk-footer">
                <button className="bk-back" onClick={() => setStepIndex(1)}><ChevronLeft size={15} /> Terug</button>
                <button className="bk-primary" disabled={!canGoDetails} onClick={() => setStepIndex(3)}>
                  Volgende <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* Step 3: confirm */}
          {stepIndex === 3 && (
            <>
              <div className="bk-summary">
                <div className="bk-summary-row"><span className="k">Type gesprek</span><span className="v">{bookingMeta.title} ({bookingMeta.durationMinutes} min)</span></div>
                <div className="bk-summary-row"><span className="k">Datum</span><span className="v">{selectedDate && formatDateLabel(selectedDate)}</span></div>
                <div className="bk-summary-row"><span className="k">Tijd</span><span className="v">{selectedTime}</span></div>
                <div className="bk-summary-row"><span className="k">Naam</span><span className="v">{form.name}</span></div>
                <div className="bk-summary-row"><span className="k">E-mail</span><span className="v">{form.email}</span></div>
                {form.phone && <div className="bk-summary-row"><span className="k">Telefoon</span><span className="v">{form.phone}</span></div>}
              </div>
              <div className="bk-badge-row">
                {slotsSource === "mock" ? (
                  <span className="bk-badge bk-badge-mock">Testboeking — wordt niet echt in Google Calendar gezet</span>
                ) : (
                  <span className="bk-badge bk-badge-real"><Check size={11} /> Wordt echt toegevoegd aan de agenda</span>
                )}
              </div>
              {error && <div className="bk-error">{error}</div>}
              <div className="bk-footer">
                <button className="bk-back" onClick={() => setStepIndex(2)}><ChevronLeft size={15} /> Terug</button>
                <button className="bk-primary" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {submitting ? "Bevestigen…" : "Bevestigen"}
                </button>
              </div>
            </>
          )}

          {/* Step 4: success */}
          {stepIndex === 4 && result && (
            <div className="bk-success">
              <div className="bk-success-icon"><Check size={26} strokeWidth={2.5} /></div>
              <h3 style={{ fontSize: 19, fontWeight: 600 }}>
                {result.source === "google-calendar" ? "Afspraak ingepland" : "Testboeking voltooid"}
              </h3>
              <p className="bk-success-detail">
                {selectedDate && formatDateLabel(selectedDate)} om {selectedTime} — {bookingMeta.title}<br />
                Bevestigingsnummer: {result.confirmationId}
              </p>
              {result.source === "google-calendar" ? (
                <>
                  <p className="bk-success-detail">U ontvangt een uitnodiging per e-mail op {form.email}.</p>
                  {result.htmlLink && (
                    <a className="bk-cal-link" href={result.htmlLink} target="_blank" rel="noreferrer">
                      Bekijk in Google Calendar <ExternalLink size={13} />
                    </a>
                  )}
                </>
              ) : (
                <div className="bk-badge-row" style={{ marginTop: 14 }}>
                  <span className="bk-badge bk-badge-mock">Demo-modus — dit is geen echte afspraak in Google Calendar</span>
                </div>
              )}
              <div className="bk-footer" style={{ justifyContent: "center", marginTop: 24 }}>
                <button className="bk-primary" onClick={onClose}>Sluiten</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
