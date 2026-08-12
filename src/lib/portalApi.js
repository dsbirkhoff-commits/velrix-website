/**
 * Thin client-side wrapper for the portal endpoints. Every call attaches
 * the current Supabase session's access token as a Bearer header — the
 * server resolves the caller's organization from that token itself (see
 * api/_orgAuth.js), so nothing here ever needs to send or trust an
 * organization_id.
 *
 * URLs live under /api/portal/... — consolidated into two dynamic router
 * files (api/portal/[resource].js and api/portal/[resource]/[id].js) to
 * stay under Vercel Hobby's 12-Serverless-Function limit. The function
 * names and behavior below are unchanged from before the consolidation;
 * only the URL paths moved.
 */
import { supabase } from "./supabaseClient.js";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(path, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Onbekende fout (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const portalApi = {
  getOrganization: () => request("/api/portal/organization"),
  updateOrganization: (body) => request("/api/portal/organization", { method: "PUT", body: JSON.stringify(body) }),

  getAppointmentSettings: () => request("/api/portal/appointment-settings"),
  updateAppointmentSettings: (body) => request("/api/portal/appointment-settings", { method: "PUT", body: JSON.stringify(body) }),

  getAiSettings: () => request("/api/portal/ai-settings"),
  updateAiSettings: (body) => request("/api/portal/ai-settings", { method: "PUT", body: JSON.stringify(body) }),

  listServices: () => request("/api/portal/services"),
  createService: (body) => request("/api/portal/services", { method: "POST", body: JSON.stringify(body) }),
  updateService: (id, body) => request(`/api/portal/services/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteService: (id) => request(`/api/portal/services/${id}`, { method: "DELETE" }),

  listCustomers: () => request("/api/portal/customers"),
  createCustomer: (body) => request("/api/portal/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/api/portal/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/api/portal/customers/${id}`, { method: "DELETE" }),

  listAppointments: () => request("/api/portal/appointments"),

  listInvoices: () => request("/api/portal/invoices"),
};
