import React, { useEffect, useState } from "react";
import { Bot, Loader2, Save, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";

const DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

export default function AiReceptionist() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    bedrijfsnaam: "",
    adres: "",
    openingstijden: {},
    diensten: [],
    faq: [],
    afspraakduur_minuten: 30,
    instructies: "",
  });
  const [newDienst, setNewDienst] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    supabase.from("ai_settings").select("*").eq("organization_id", orgId).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error(error);
      if (data) {
        setForm({
          bedrijfsnaam: data.bedrijfsnaam || "",
          adres: data.adres || "",
          openingstijden: data.openingstijden || {},
          diensten: data.diensten || [],
          faq: data.faq || [],
          afspraakduur_minuten: data.afspraakduur_minuten || 30,
          instructies: data.instructies || "",
        });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const save = async () => {
    setSaving(true);
    setToast(null);
    const { error } = await supabase.from("ai_settings").upsert(
      { organization_id: orgId, ...form, updated_at: new Date().toISOString() },
      { onConflict: "organization_id" }
    );
    setSaving(false);
    setToast(error ? { type: "error", msg: "Opslaan mislukt. Probeer het opnieuw." } : { type: "success", msg: "Instellingen opgeslagen." });
  };

  const addDienst = () => {
    if (!newDienst.trim()) return;
    setForm((f) => ({ ...f, diensten: [...f.diensten, newDienst.trim()] }));
    setNewDienst("");
  };
  const removeDienst = (i) => setForm((f) => ({ ...f, diensten: f.diensten.filter((_, idx) => idx !== i) }));

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setForm((f) => ({ ...f, faq: [...f.faq, { q: newFaqQ.trim(), a: newFaqA.trim() }] }));
    setNewFaqQ("");
    setNewFaqA("");
  };
  const removeFaq = (i) => setForm((f) => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }));

  if (loading) {
    return <div className="dp-empty"><Loader2 size={20} className="animate-spin" /></div>;
  }

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">AI Receptionist</h1>
        <p className="dp-sub">Deze gegevens bepalen straks hoe de AI Receptionist telefoontjes en klantvragen afhandelt.</p>
      </div>

      {toast && <div className={`dp-toast ${toast.type === "success" ? "dp-toast-success" : "dp-toast-error"}`}>{toast.msg}</div>}

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title"><Bot size={15} /> Bedrijfsgegevens</div>
          <div className="dp-field">
            <label className="dp-label">Bedrijfsnaam</label>
            <input className="dp-input" value={form.bedrijfsnaam} onChange={(e) => setForm((f) => ({ ...f, bedrijfsnaam: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Adres</label>
            <input className="dp-input" value={form.adres} onChange={(e) => setForm((f) => ({ ...f, adres: e.target.value }))} />
          </div>
          <div className="dp-field">
            <label className="dp-label">Afspraakduur (minuten)</label>
            <input type="number" className="dp-input" value={form.afspraakduur_minuten} onChange={(e) => setForm((f) => ({ ...f, afspraakduur_minuten: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="dp-card">
          <div className="dp-section-title">Openingstijden</div>
          {DAYS.map((day) => (
            <div key={day} className="dp-field" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 90, fontSize: 12.5, color: "var(--text-muted)" }}>{day}</span>
              <input
                className="dp-input"
                placeholder="bijv. 08:00–17:30 of Gesloten"
                value={form.openingstijden[day] || ""}
                onChange={(e) => setForm((f) => ({ ...f, openingstijden: { ...f.openingstijden, [day]: e.target.value } }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="dp-grid dp-cols-2" style={{ marginBottom: 16 }}>
        <div className="dp-card">
          <div className="dp-section-title">Diensten</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {form.diensten.map((d, i) => (
              <span key={i} className="dp-badge dp-badge-gray" style={{ gap: 6 }}>
                {d} <X size={11} style={{ cursor: "pointer" }} onClick={() => removeDienst(i)} />
              </span>
            ))}
            {form.diensten.length === 0 && <span style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Nog geen diensten toegevoegd.</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="dp-input" placeholder="bijv. APK-keuring" value={newDienst} onChange={(e) => setNewDienst(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDienst())} />
            <button className="dp-btn-ghost" onClick={addDienst} type="button"><Plus size={14} /> Toevoegen</button>
          </div>
        </div>

        <div className="dp-card">
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
      </div>

      <div className="dp-card" style={{ marginBottom: 16 }}>
        <div className="dp-section-title">Instructies voor AI Receptionist</div>
        <textarea
          className="dp-textarea"
          rows={5}
          placeholder="Bijv. toon, wat de AI wel/niet mag beloven, wanneer doorverbinden naar een mens..."
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
