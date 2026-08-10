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

// Lazy-loaded: the customer portal (and the Supabase client it needs)
// ships as its own chunk, only downloaded by visitors who actually go to
// /login or /dashboard/*. Public-site visitors never pay for this weight
// — keeps the existing site exactly as fast as before this feature.
const AuthProvider = lazy(() => import("./contexts/AuthContext.jsx").then((m) => ({ default: m.AuthProvider })));
const RequireAuth = lazy(() => import("./components/RequireAuth.jsx"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Overview = lazy(() => import("./pages/dashboard/Overview.jsx"));
const Appointments = lazy(() => import("./pages/dashboard/Appointments.jsx"));
const Calls = lazy(() => import("./pages/dashboard/Calls.jsx"));
const Customers = lazy(() => import("./pages/dashboard/Customers.jsx"));
const AiReceptionist = lazy(() => import("./pages/dashboard/AiReceptionist.jsx"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings.jsx"));

function PortalFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0d" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "#c9a668" }} />
    </div>
  );
}

function Portal({ children }) {
  // AuthProvider only wraps the portal routes — the public site (Home,
  // Demo, booking flow, etc.) never mounts it or its Supabase client.
  return (
    <Suspense fallback={<PortalFallback />}>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
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

          {/* Klantportaal — eigen lazy-loaded chunk */}
          <Route
            path="/login"
            element={
              <Portal>
                <Login />
              </Portal>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Portal>
                <Suspense fallback={<PortalFallback />}>
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                </Suspense>
              </Portal>
            }
          >
            <Route index element={<Suspense fallback={<PortalFallback />}><Overview /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<PortalFallback />}><Appointments /></Suspense>} />
            <Route path="calls" element={<Suspense fallback={<PortalFallback />}><Calls /></Suspense>} />
            <Route path="customers" element={<Suspense fallback={<PortalFallback />}><Customers /></Suspense>} />
            <Route path="ai-receptionist" element={<Suspense fallback={<PortalFallback />}><AiReceptionist /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PortalFallback />}><DashboardSettings /></Suspense>} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
