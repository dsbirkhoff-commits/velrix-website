/**
 * Thin client-side wrapper for /api/admin/index.js — one consolidated
 * function, resources dispatched via ?resource=. See that file's header
 * comment for why (Vercel Hobby function-count headroom). Every call
 * attaches the current Supabase session's access token; the server
 * verifies is_velrix_admin() independently on every single resource
 * branch — this file only builds URLs, it grants no access itself.
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

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? "&" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&") : "";
}

export const adminApi = {
  // Overview
  getOverview: () => request(`/api/admin/index?resource=overview`),

  // Organizations
  listOrganizations: () => request(`/api/admin/index?resource=organizations`),
  getOrganization: (id) => request(`/api/admin/index?resource=organizations&id=${encodeURIComponent(id)}`),
  createOrganization: (body) => request(`/api/admin/index?resource=organizations`, { method: "POST", body: JSON.stringify(body) }),
  updateOrganization: (id, body) => request(`/api/admin/index?resource=organizations&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  activateOrganization: (id) => request(`/api/admin/index?resource=organizations&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ action: "activate" }) }),
  pauseOrganization: (id) => request(`/api/admin/index?resource=organizations&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ action: "pause" }) }),
  resendInvite: (orgId, userId) => request(`/api/admin/index?resource=organizations&id=${encodeURIComponent(orgId)}`, { method: "PUT", body: JSON.stringify({ action: "resend_invite", user_id: userId }) }),

  // Users
  listUsers: (organizationId) => request(`/api/admin/index?resource=users${qs({ organization_id: organizationId })}`),
  updateUser: (userId, body) => request(`/api/admin/index?resource=users&id=${encodeURIComponent(userId)}`, { method: "PUT", body: JSON.stringify(body) }),

  // Subscriptions
  listSubscriptions: (organizationId) => request(`/api/admin/index?resource=subscriptions${qs({ organization_id: organizationId })}`),
  updateSubscription: (id, body) => request(`/api/admin/index?resource=subscriptions&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),

  // Industries (Branches)
  listIndustries: () => request(`/api/admin/index?resource=industries`),
  createIndustry: (body) => request(`/api/admin/index?resource=industries`, { method: "POST", body: JSON.stringify(body) }),
  updateIndustry: (id, body) => request(`/api/admin/index?resource=industries&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteIndustry: (id) => request(`/api/admin/index?resource=industries&id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // Custom field templates
  listTemplates: (industryId) => request(`/api/admin/index?resource=custom-field-templates${qs({ industry_id: industryId })}`),
  getTemplate: (id) => request(`/api/admin/index?resource=custom-field-templates&id=${encodeURIComponent(id)}`),
  createTemplate: (body) => request(`/api/admin/index?resource=custom-field-templates`, { method: "POST", body: JSON.stringify(body) }),
  updateTemplate: (id, body) => request(`/api/admin/index?resource=custom-field-templates&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTemplate: (id) => request(`/api/admin/index?resource=custom-field-templates&id=${encodeURIComponent(id)}`, { method: "DELETE" }),

  // Cross-org, read-only data viewers
  listOrgCustomers: (organizationId) => request(`/api/admin/index?resource=customers&organization_id=${encodeURIComponent(organizationId)}`),
  listOrgAppointments: (organizationId) => request(`/api/admin/index?resource=appointments&organization_id=${encodeURIComponent(organizationId)}`),
  listOrgServices: (organizationId) => request(`/api/admin/index?resource=services&organization_id=${encodeURIComponent(organizationId)}`),
  getOrgAiSettings: (organizationId) => request(`/api/admin/index?resource=ai_settings&organization_id=${encodeURIComponent(organizationId)}`),

  // Invoices
  listInvoices: (organizationId) => request(`/api/admin/index?resource=invoices${qs({ organization_id: organizationId })}`),
  createInvoice: (body) => request(`/api/admin/index?resource=invoices`, { method: "POST", body: JSON.stringify(body) }),
  updateInvoice: (id, body) => request(`/api/admin/index?resource=invoices&id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteInvoice: (id) => request(`/api/admin/index?resource=invoices&id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
