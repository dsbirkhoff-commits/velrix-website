import React, { useEffect, useState } from "react";
import { Bot, Loader2, Save, Plus, X, Power } from "lucide-react";
import { portalApi } from "../../../lib/portalApi.js";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

const EMPTY_FORM = {
  ai_actief: false,
  begroeting: "",
  bedrijfsomschrijving: "",
  faq: [],
  toegestane_onderwerpen: "",
  verboden_onderwerpen: "",
  doorverbinden_wanneer: "",
  instructies: "",
};

export default function AiReceptionist() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  useEffect(() => {
    let cancelled = false;
    portalApi
      .getAiSettings()
      .then((data) => {
        if (cancelled) return;
        setForm({
          ai_actief: Boolean(data.ai_actief),
          begroeting: data.begroeting || "",
          bedrijfsomschrijving: data.bedrijfsomschrijving || "",
          faq: data.faq || [],
          toegestane_onderwerpen: data.toegestane_onderwerpen || "",
          verboden_onderwerpen: data.verboden_onderwerpen || "",
          doorverbinden_wanneer: data.doorverbinden_wanneer || "",
          instructies: data.instructies || "",
        });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    setToast(null);
    try {
      await portalApi.updateAiSettings(form);
      setToast({ type: "success", msg: "Opgeslagen" });
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Opslaan mislukt." });
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setForm((f) => ({ ...f, faq: [...f.faq, { q: newFaqQ.trim(), a: newFaqA.trim() }] }));
    setNewFaqQ("");
    setNewFaqA("");
  };
  const removeFaq = (i) => setForm((f) => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }));

  if (loading) return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  if (error) return <div className="dp-empty">{error}</div>;

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">AI Receptionist</h1>
        <p className="dp-sub">Bepaalt hoe de AI Receptionist zich straks gedraagt aan de telefoon. De daadwerkelijke telefonie is nog niet actief.</p>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="dp-section-title" style={{ marginBottom: 0 }}><Power size={15} /> AI Receptionist</div>
        <span
          className={`dp-badge ${form.ai_actief ? "dp-badge-green" : "dp-badge-gray"}`}
          style={{ cursor: "pointer" }}
          onClick={() => setForm((f) => ({ ...f, ai_actief: !f.ai_actief }))}
        >
          {form.ai_actief ? "Aan" : "Uit"}
        </span>
      </div>

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><Bot size={15} /> Begroeting &amp; omschrijving</div>
          <div className="dp-field">
            <label className="dp-label">Begroeting</label>
            <input className="dp-input" placeholder="Bijv. 'Goedemiddag, u spreekt met [bedrijfsnaam]...'" value={form.begroeting} onChange={(e) => setForm((f) => ({ ...f, begroeting: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Bedrijfsomschrijving</label>
            <textarea className="dp-textarea" rows={3} value={form.bedrijfsomschrijving} onChange={(e) => setForm((f) => ({ ...f, bedrijfsomschrijving: e.target.value }))} />
          </div>
        </div>

        <div className="dp-card">
          <div className="dp-section-title">Grenzen van het gesprek</div>
          <div className="dp-field">
            <label className="dp-label">Wat de AI wél mag beantwoorden</label>
            <textarea className="dp-textarea" rows={2} value={form.toegestane_onderwerpen} onChange={(e) => setForm((f) => ({ ...f, toegestane_onderwerpen: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Wat de AI niet mag beantwoorden</label>
            <textarea className="dp-textarea" rows={2} value={form.verboden_onderwerpen} onChange={(e) => setForm((f) => ({ ...f, verboden_onderwerpen: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Wanneer doorverbinden naar een mens</label>
            <textarea className="dp-textarea" rows={2} value={form.doorverbinden_wanneer} onChange={(e) => setForm((f) => ({ ...f, doorverbinden_wanneer: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <div className="dp-section-title">Veelgestelde vragen</div>
        {form.faq.map((item, i) => (
          <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: "var(--ink-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 12.5 }}>{item.q}</strong>
              <X size={13} style={{ cursor: "pointer", flexShrink: 0, color: "var(--text-dim)" }} onClick={() => removeFaq(i)} />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 0" }}>{item.a}</p>
          </div>
        ))}
        <div className="dp-field"><input className="dp-input" placeholder="Vraag" value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} /></div>
        <div className="dp-field"><input className="dp-input" placeholder="Antwoord" value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} /></div>
        <button className="dp-btn-ghost" onClick={addFaq} type="button"><Plus size={14} /> FAQ toevoegen</button>
      </div>

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <div className="dp-section-title">Overige instructies</div>
        <textarea
          className="dp-textarea"
          rows={4}
          placeholder="Overige richtlijnen voor de AI Receptionist..."
          value={form.instructies}
          onChange={(e) => setForm((f) => ({ ...f, instructies: e.target.value }))}
        />
      </div>

      <button className="dp-btn" onClick={save} disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Opslaan…" : "Opslaan"}
      </button>
    </div>
  );
}
