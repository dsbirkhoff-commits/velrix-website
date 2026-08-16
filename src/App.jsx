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
const ResetPassword = lazy(() => import("./pages/portal/ResetPassword.jsx"));
const Overview = lazy(() => import("./pages/portal/dashboard/Overview.jsx"));
const Appointments = lazy(() => import("./pages/portal/dashboard/Appointments.jsx"));
const Calls = lazy(() => import("./pages/portal/dashboard/Calls.jsx"));
const Customers = lazy(() => import("./pages/portal/dashboard/Customers.jsx"));
const AiReceptionist = lazy(() => import("./pages/portal/dashboard/AiReceptionist.jsx"));
const PortalSettings = lazy(() => import("./pages/portal/dashboard/Settings.jsx"));
const CompanySettings = lazy(() => import("./pages/portal/settings/Company.jsx"));
const Services = lazy(() => import("./pages/portal/Services.jsx"));
const AppointmentSettings = lazy(() => import("./pages/portal/settings/AppointmentSettings.jsx"));
const Invoices = lazy(() => import("./pages/portal/Invoices.jsx"));

// Admin Backend — eigen, aparte lazy chunk. Deelt AuthProvider met de
// portal (dezelfde sessie/profiel-context), maar heeft een eigen layout
// en een eigen route-guard (RequireVelrixAdmin) bovenop RequireAuth.
const RequireVelrixAdmin = lazy(() => import("./components/RequireVelrixAdmin.jsx"));
const AdminLayout = lazy(() => import("./components/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminOrganizations = lazy(() => import("./pages/admin/AdminOrganizations.jsx"));
const AdminOrganizationNew = lazy(() => import("./pages/admin/AdminOrganizationNew.jsx"));
const AdminOrganizationDetail = lazy(() => import("./pages/admin/AdminOrganizationDetail.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminBranches = lazy(() => import("./pages/admin/AdminBranches.jsx"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates.jsx"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers.jsx"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments.jsx"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices.jsx"));
const AdminAiReceptionists = lazy(() => import("./pages/admin/AdminAiReceptionists.jsx"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices.jsx"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions.jsx"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem.jsx"));

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

/** Zelfde patroon, met een extra RequireVelrixAdmin-laag bovenop
 * RequireAuth — geen enkele bestaande /portal/*-route wordt hierdoor
 * geraakt, dit is een volledig aparte boom. */
function ProtectedAdminLayout() {
  return (
    <PortalRoot>
      <Suspense fallback={<PortalFallback />}>
        <RequireAuth>
          <Suspense fallback={<PortalFallback />}>
            <RequireVelrixAdmin>
              <AdminLayout />
            </RequireVelrixAdmin>
          </Suspense>
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
          <Route
            path="/portal/reset-password"
            element={
              <PortalRoot>
                <ResetPassword />
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
            <Route path="/portal/settings/company" element={<Suspense fallback={<PortalFallback />}><CompanySettings /></Suspense>} />
            <Route path="/portal/settings/appointments" element={<Suspense fallback={<PortalFallback />}><AppointmentSettings /></Suspense>} />
            <Route path="/portal/services" element={<Suspense fallback={<PortalFallback />}><Services /></Suspense>} />
            <Route path="/portal/invoices" element={<Suspense fallback={<PortalFallback />}><Invoices /></Suspense>} />
          </Route>

          {/* VELRIX Admin Backend — uitsluitend voor VELRIX-admins, zie RequireVelrixAdmin */}
          <Route element={<ProtectedAdminLayout />}>
            <Route path="/admin" element={<Suspense fallback={<PortalFallback />}><AdminDashboard /></Suspense>} />
            <Route path="/admin/organizations" element={<Suspense fallback={<PortalFallback />}><AdminOrganizations /></Suspense>} />
            <Route path="/admin/organizations/new" element={<Suspense fallback={<PortalFallback />}><AdminOrganizationNew /></Suspense>} />
            <Route path="/admin/organizations/:id" element={<Suspense fallback={<PortalFallback />}><AdminOrganizationDetail /></Suspense>} />
            <Route path="/admin/users" element={<Suspense fallback={<PortalFallback />}><AdminUsers /></Suspense>} />
            <Route path="/admin/branches" element={<Suspense fallback={<PortalFallback />}><AdminBranches /></Suspense>} />
            <Route path="/admin/custom-field-templates" element={<Suspense fallback={<PortalFallback />}><AdminTemplates /></Suspense>} />
            <Route path="/admin/customers" element={<Suspense fallback={<PortalFallback />}><AdminCustomers /></Suspense>} />
            <Route path="/admin/appointments" element={<Suspense fallback={<PortalFallback />}><AdminAppointments /></Suspense>} />
            <Route path="/admin/services" element={<Suspense fallback={<PortalFallback />}><AdminServices /></Suspense>} />
            <Route path="/admin/ai-receptionists" element={<Suspense fallback={<PortalFallback />}><AdminAiReceptionists /></Suspense>} />
            <Route path="/admin/invoices" element={<Suspense fallback={<PortalFallback />}><AdminInvoices /></Suspense>} />
            <Route path="/admin/subscriptions" element={<Suspense fallback={<PortalFallback />}><AdminSubscriptions /></Suspense>} />
            <Route path="/admin/system" element={<Suspense fallback={<PortalFallback />}><AdminSystem /></Suspense>} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
