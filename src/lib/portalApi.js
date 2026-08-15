/**
 * Thin client-side wrapper for the Fase 2 "API-first" endpoints
 * (/api/organization, /api/services, /api/appointment-settings,
 * /api/ai-settings). Every call attaches the current Supabase session's
 * access token as a Bearer header — the server resolves the caller's
 * organization from that token itself (see api/_orgAuth.js), so nothing
 * here ever needs to send or trust an organization_id.
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
  getOrganization: () => request("/api/organization"),
  updateOrganization: (body) => request("/api/organization", { method: "PUT", body: JSON.stringify(body) }),
  listInvoices: () => request("/api/organization?resource=invoices"),

  getAppointmentSettings: () => request("/api/appointment-settings"),
  updateAppointmentSettings: (body) => request("/api/appointment-settings", { method: "PUT", body: JSON.stringify(body) }),

  getAiSettings: () => request("/api/ai-settings"),
  updateAiSettings: (body) => request("/api/ai-settings", { method: "PUT", body: JSON.stringify(body) }),

  listServices: () => request("/api/services"),
  createService: (body) => request("/api/services", { method: "POST", body: JSON.stringify(body) }),
  updateService: (id, body) => request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteService: (id) => request(`/api/services/${id}`, { method: "DELETE" }),

  listCustomers: () => request("/api/customers"),
  createCustomer: (body) => request("/api/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),

  getCustomFieldsSchema: () => request("/api/custom-fields-schema"),
};
