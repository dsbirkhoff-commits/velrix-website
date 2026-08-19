import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Building2, ArrowRight } from "lucide-react";
import { adminApi } from "../../lib/adminApi.js";
import DashboardPageStyles from "../../components/DashboardPageStyles.jsx";
import DarkSelect from "../../components/DarkSelect.jsx";

export default function AdminOrganizationNew() {
  const navigate = useNavigate();
  const [industries, setIndustries] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", industry_id: "", template_id: "", plan_name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.listIndustries().then(setIndustries).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.industry_id) { setTemplates([]); return; }
    adminApi.listTemplates(form.industry_id).then(setTemplates).catch(() => setTemplates([]));
  }, [form.industry_id]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const org = await adminApi.createOrganization({
        name: form.name, email: form.email,
        industry_id: form.industry_id || null,
        template_id: form.template_id || null,
        plan_name: form.plan_name || null,
      });
      navigate(`/admin/organizations/${org.id}`);
    } catch (err) {
      setError(err.message || "Aanmaken mislukt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title"><Building2 size={20} style={{ verticalAlign: "-3px", marginRight: 8 }} />Nieuwe organisatie</h1>
        <p className="dp-sub">Organisatie → branche → custom-field template → gebruiker → abonnement. Bij een mislukte stap wordt alles automatisch teruggedraaid.</p>
      </div>

      <div className="dp-card" style={{ maxWidth: 560 }}>
        <form onSubmit={submit}>
          <div className="dp-field">
            <label className="dp-label">Bedrijfsnaam *</label>
            <input className="dp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="dp-field">
            <label className="dp-label">E-mailadres eerste gebruiker *</label>
            <input type="email" className="dp-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <p style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 6 }}>Ontvangt automatisch een uitnodiging om een wachtwoord in te stellen.</p>
          </div>
          <div className="dp-field">
            <label className="dp-label">Branche (optioneel)</label>
            <DarkSelect
              value={form.industry_id}
              onChange={(val) => setForm((f) => ({ ...f, industry_id: val, template_id: "" }))}
              options={industries.map((i) => ({ value: i.id, label: i.name }))}
              placeholder="— Geen branche —"
            />
          </div>
          {form.industry_id && (
            <div className="dp-field">
              <label className="dp-label">Custom-field template (optioneel)</label>
              <select className="dp-select" value={form.template_id} onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}>
                <option value="">— Geen template —</option>
                {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
          )}
          <div className="dp-field">
            <label className="dp-label">Abonnement</label>
            <input className="dp-input" placeholder="bijv. Starter" value={form.plan_name} onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))} />
          </div>
          {error && <div className="dp-toast dp-toast-error">{error}</div>}
          <style>{`
            .dp-btn-white { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; background: #ffffff; color: #17130a; font-weight: 600; font-size: 13.5px; font-family: inherit; transition: background .15s; }
            .dp-btn-white:hover:not(:disabled) { background: #e8e8e8; }
            .dp-btn-white:disabled { cursor: default; opacity: .7; }
          `}</style>
          <button type="submit" className="dp-btn-white" disabled={submitting}>
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            {submitting ? "Bezig…" : "Organisatie aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}
