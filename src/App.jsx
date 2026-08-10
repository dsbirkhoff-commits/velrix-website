import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BookingProvider } from "./components/BookingProvider.jsx";
import Home from "./pages/Home.jsx";
import Demo from "./pages/Demo.jsx";
import Contact from "./pages/Contact.jsx";
import PlanMeeting from "./pages/PlanMeeting.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import AdminConnect from "./pages/AdminConnect.jsx";

// Lazy-loaded: het VELRIX-klantportaal (en de Supabase-client die het
// nodig heeft) is een eigen chunk, alleen gedownload door bezoekers die
// echt naar /portal/* gaan. Bezoekers van de publieke site betalen hier
// niets voor — de bestaande site blijft exact even snel.
const AuthProvider = lazy(() => import("./contexts/AuthContext.jsx").then((m) => ({ default: m.AuthProvider })));
const RequireAuth = lazy(() => import("./components/RequireAuth.jsx"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout.jsx"));
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin.jsx"));
const Overview = lazy(() => import("./pages/portal/dashboard/Overview.jsx"));
const Appointments = lazy(() => import("./pages/portal/dashboard/Appointments.jsx"));
const Calls = lazy(() => import("./pages/portal/dashboard/Calls.jsx"));
const Customers = lazy(() => import("./pages/portal/dashboard/Customers.jsx"));
const AiReceptionist = lazy(() => import("./pages/portal/dashboard/AiReceptionist.jsx"));
const PortalSettings = lazy(() => import("./pages/portal/dashboard/Settings.jsx"));

function PortalFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
    </div>
  );
}

/** Wraps every /portal/* route below: Suspense (code-split loading) +
 * AuthProvider (session/profile/org) — mounted only for portal routes,
 * never for the public site. */
function PortalRoot({ children }) {
  return (
    <Suspense fallback={<PortalFallback />}>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}

/** Pathless layout route: renders the sidebar shell once, behind the
 * auth guard, and lets each dashboard page below live at its own
 * top-level /portal/... path (not nested under /portal/dashboard/...). */
function ProtectedPortalLayout() {
  return (
    <PortalRoot>
      <Suspense fallback={<PortalFallback />}>
        <RequireAuth>
          <DashboardLayout />
        </RequireAuth>
      </Suspense>
    </PortalRoot>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Routes>
          {/* Publieke website — ongewijzigd, geen Supabase in deze bundel */}
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/plan-een-gesprek" element={<PlanMeeting />} />
          <Route path="/algemene-voorwaarden" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin/koppel-agenda" element={<AdminConnect />} />

          {/* VELRIX Klantportaal */}
          <Route
            path="/portal/login"
            element={
              <PortalRoot>
                <PortalLogin />
              </PortalRoot>
            }
          />

          <Route element={<ProtectedPortalLayout />}>
            <Route path="/portal/dashboard" element={<Suspense fallback={<PortalFallback />}><Overview /></Suspense>} />
            <Route path="/portal/appointments" element={<Suspense fallback={<PortalFallback />}><Appointments /></Suspense>} />
            <Route path="/portal/calls" element={<Suspense fallback={<PortalFallback />}><Calls /></Suspense>} />
            <Route path="/portal/customers" element={<Suspense fallback={<PortalFallback />}><Customers /></Suspense>} />
            <Route path="/portal/ai-receptionist" element={<Suspense fallback={<PortalFallback />}><AiReceptionist /></Suspense>} />
            <Route path="/portal/settings" element={<Suspense fallback={<PortalFallback />}><PortalSettings /></Suspense>} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
