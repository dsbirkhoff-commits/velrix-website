import React, { useEffect, useState } from "react";
import { CalendarClock, CalendarDays, UserPlus, Phone, PhoneMissed, Bot } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import DashboardPageStyles from "../../../components/DashboardPageStyles.jsx";

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
}
function addDaysISO(dateISO, days) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const scratch = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n) => String(n).padStart(2, "0");
  return `${scratch.getUTCFullYear()}-${pad(scratch.getUTCMonth() + 1)}-${pad(scratch.getUTCDate())}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default function Overview() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vandaag: 0, komende7: 0, nieuweLeads: 0, gesprekken: 0, gemist: 0 });
  const [calendarStatus, setCalendarStatus] = useState(null);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; } // FIX: voorkomt oneindig "Laden…" als orgId nooit een waarde krijgt (zie audit)
    let cancelled = false;
    async function load() {
      setLoading(true);
      const today = todayISO();
      const in7 = addDaysISO(today, 7);

      const [todayRes, weekRes, callsRes, missedRes, calRes] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("datum", today),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("datum", today).lte("datum", in7),
        supabase.from("calls").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("calls").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "gemist"),
        supabase.from("calendar_connections").select("status").eq("organization_id", orgId).maybeSingle(),
      ]);

      // "Nieuwe leads" = klanten toegevoegd in de laatste 7 dagen — een eerlijke,
      // uit echte data afgeleide indicator, geen los, ongekoppeld getal.
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const leadsRes = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (!cancelled) {
        setStats({
          vandaag: todayRes.count || 0,
          komende7: weekRes.count || 0,
          nieuweLeads: leadsRes.count || 0,
          gesprekken: callsRes.count || 0,
          gemist: missedRes.count || 0,
        });
        setCalendarStatus(calRes.data?.status || "not_connected");
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [orgId]);

  const kpis = [
    { label: "Afspraken vandaag", value: stats.vandaag, icon: CalendarClock },
    { label: "Komende 7 dagen", value: stats.komende7, icon: CalendarDays },
    { label: "Nieuwe leads (7 dagen)", value: stats.nieuweLeads, icon: UserPlus },
    { label: "Gesprekken totaal", value: stats.gesprekken, icon: Phone },
    { label: "Gemiste gesprekken", value: stats.gemist, icon: PhoneMissed },
  ];

  return (
    <div>
      <DashboardPageStyles />
      <div className="dp-header">
        <h1 className="dp-title">{greeting()}</h1>
        <p className="dp-sub">Hier vind je een overzicht van jouw VELRIX-systeem — {membership?.organizations?.name || "je organisatie"}.</p>
      </div>

      <div className="dp-grid dp-cols-3" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div key={k.label} className="dp-card">
            <div className="dp-kpi-label"><k.icon size={14} /> {k.label}</div>
            <div className="dp-kpi-value">{loading ? "…" : k.value}</div>
          </div>
        ))}
        <div className="dp-card">
          <div className="dp-kpi-label"><Bot size={14} /> AI Receptionist status</div>
          <div style={{ marginTop: 10 }}>
            <span className="dp-badge dp-badge-gray">Nog niet actief (voice AI in ontwikkeling)</span>
          </div>
        </div>
        <div className="dp-card">
          <div className="dp-kpi-label"><CalendarClock size={14} /> Google Calendar</div>
          <div style={{ marginTop: 10 }}>
            {calendarStatus === "connected" ? (
              <span className="dp-badge dp-badge-green">Verbonden</span>
            ) : (
              <span className="dp-badge dp-badge-gray">Niet gekoppeld</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
