import React from "react";

/** Shared CSS for every /dashboard/* page — kept in one place so the six
 * pages don't each duplicate the same few hundred lines. */
export default function DashboardPageStyles() {
  return (
    <style>{`
      .dp-header { margin-bottom: 26px; }
      .dp-title { font-size: 24px; font-weight: 500; }
      .dp-sub { font-size: 13.5px; color: var(--text-muted); margin-top: 4px; }
      .dp-grid { display: grid; gap: 16px; }
      .dp-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .dp-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .dp-cols-4 { grid-template-columns: repeat(4, 1fr); }
      @media (max-width: 900px) { .dp-cols-2, .dp-cols-3, .dp-cols-4 { grid-template-columns: 1fr 1fr; } }
      .dp-card { border: 1px solid var(--border); background: var(--surface); border-radius: 16px; padding: 20px 22px; }
      .dp-kpi-label { font-size: 12px; color: var(--text-dim); display: flex; align-items: center; gap: 6px; }
      .dp-kpi-value { font-size: 30px; font-weight: 600; margin-top: 8px; font-family: 'Fraunces', serif; }
      .dp-section-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
      .dp-table { width: 100%; border-collapse: collapse; }
      .dp-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-dim); padding: 0 12px 10px; font-weight: 600; }
      .dp-table td { padding: 12px; border-top: 1px solid var(--border); font-size: 13.5px; }
      .dp-table tr:hover td { background: rgba(255,255,255,.015); }
      .dp-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 9px; border-radius: 999px; font-weight: 500; }
      .dp-badge-green { color: var(--green); background: rgba(111,209,138,.1); border: 1px solid rgba(111,209,138,.3); }
      .dp-badge-red { color: var(--red); background: rgba(230,148,122,.1); border: 1px solid rgba(230,148,122,.3); }
      .dp-badge-gold { color: var(--gold-bright); background: rgba(201,166,104,.1); border: 1px solid var(--border-strong); }
      .dp-badge-gray { color: var(--text-dim); background: rgba(255,255,255,.03); border: 1px solid var(--border-strong); }
      .dp-empty { text-align: center; padding: 56px 20px; color: var(--text-dim); font-size: 13.5px; }
      .dp-empty-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(201,166,104,.08); border: 1px solid var(--border-strong); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--gold); }
      .dp-field { margin-bottom: 16px; }
      .dp-label { display: block; font-size: 12.5px; color: var(--text-dim); margin-bottom: 6px; }
      .dp-input, .dp-textarea, .dp-select { width: 100%; background: var(--ink-2); border: 1px solid var(--border-strong); border-radius: 10px; padding: 10px 13px; font-size: 13.5px; color: var(--text); outline: none; box-sizing: border-box; font-family: inherit; }
      .dp-input:focus, .dp-textarea:focus, .dp-select:focus { border-color: var(--gold); }
      .dp-textarea { resize: vertical; min-height: 80px; }
      .dp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(150deg, var(--gold-bright), var(--gold)); color: #17130a; font-weight: 600; font-size: 13.5px; }
      .dp-btn:disabled { opacity: .6; cursor: wait; }
      .dp-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border-strong); cursor: pointer; background: none; color: var(--text); font-weight: 500; font-size: 13.5px; }
      .dp-toast { font-size: 12.5px; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; }
      .dp-toast-success { color: var(--green); background: rgba(111,209,138,.08); border: 1px solid rgba(111,209,138,.3); }
      .dp-toast-error { color: var(--red); background: rgba(230,148,122,.08); border: 1px solid rgba(230,148,122,.3); }
    `}</style>
  );
}
