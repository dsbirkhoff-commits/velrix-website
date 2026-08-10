/**
 * Booking service — single point of contact between the UI and "wherever
 * availability/bookings actually come from".
 *
 * Today: the /api/availability and /api/book serverless functions respond
 * with 501 (not configured) because no Google Calendar credentials exist
 * yet, so every call here transparently falls back to a mock provider.
 *
 * Once GOOGLE_CALENDAR_* environment variables are set in Vercel (see
 * /api/_googleCalendar.js and the README), those same endpoints will start
 * returning real data automatically — no changes needed in this file or in
 * the UI. The `source` field on every response tells the UI which one it got.
 */

const MEETING_TITLE = "Gratis kennismaking";
const MEETING_DURATION_MIN = 30;
const BUSINESS_HOURS = { startHour: 9, endHour: 17 };
const SLOT_STEP_MIN = 30;

/* ---------------------------------------------------------------------- */
/*  Public API                                                             */
/* ---------------------------------------------------------------------- */

/**
 * @param {string} dateISO  "YYYY-MM-DD"
 * @returns {Promise<{ source: "google-calendar"|"mock", date: string, slots: string[] }>}
 */
export async function getAvailability(dateISO) {
  try {
    const res = await fetch(`/api/availability?date=${encodeURIComponent(dateISO)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.configured && Array.isArray(data.slots)) {
        return { source: "google-calendar", date: dateISO, slots: data.slots };
      }
    }
  } catch {
    // Serverless function not reachable (e.g. local static preview) — fall through to mock.
  }
  return getMockAvailability(dateISO);
}

/**
 * @param {{ dateISO:string, time:string, name:string, email:string }} payload
 * @returns {Promise<{ source: "google-calendar"|"mock", confirmationId: string, htmlLink?: string }>}
 * @throws {Error} with `.code` set to "SLOT_TAKEN" or "UNREACHABLE" when the
 *   real backend explicitly rejects the booking — these must NOT silently
 *   fall back to the mock provider, or the UI would confirm a booking that
 *   never actually happened.
 */
export async function createBooking(payload) {
  let res;
  try {
    res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // No serverless function reachable at all (e.g. local static preview
    // with no backend running) — the only case where falling back to the
    // mock provider is legitimate, since there is no real backend to defer to.
    return createMockBooking(payload);
  }

  if (res.status === 501) {
    // Google Calendar genuinely not configured yet — legitimate Testmodus.
    return createMockBooking(payload);
  }

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.success && data.source === "google-calendar") {
    return { source: "google-calendar", confirmationId: data.eventId, htmlLink: data.htmlLink };
  }

  if (res.status === 409 && data.reason === "slot_taken") {
    const err = new Error(data.message || "Dit tijdstip is zojuist geboekt. Kies een ander beschikbaar tijdstip.");
    err.code = "SLOT_TAKEN";
    throw err;
  }

  if (res.status === 503 && data.reason === "unreachable") {
    const err = new Error(data.message || "Het lukt momenteel niet om de beschikbaarheid te controleren. Probeer het over een moment opnieuw.");
    err.code = "UNREACHABLE";
    throw err;
  }

  // Any other failure from a real, configured backend: never silently
  // fall back to mock and pretend the booking succeeded.
  const err = new Error(data.error || data.message || "Kon de afspraak niet aanmaken.");
  err.code = "BOOKING_FAILED";
  throw err;
}

export const bookingMeta = {
  title: MEETING_TITLE,
  durationMinutes: MEETING_DURATION_MIN,
};

/* ---------------------------------------------------------------------- */
/*  Mock provider — deterministic, clearly labeled, never pretends to be   */
/*  a real calendar. Used only until Google Calendar is configured.        */
/* ---------------------------------------------------------------------- */

function getMockAvailability(dateISO) {
  const date = new Date(dateISO + "T00:00:00");
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    return { source: "mock", date: dateISO, slots: [] };
  }

  // Deterministic pseudo-randomness so the same date always shows the same
  // "availability" during a session, without needing a real backend.
  const seed = hashString(dateISO);
  const slots = [];
  for (let h = BUSINESS_HOURS.startHour; h < BUSINESS_HOURS.endHour; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP_MIN) {
      const slotIndex = (h - BUSINESS_HOURS.startHour) * (60 / SLOT_STEP_MIN) + m / SLOT_STEP_MIN;
      const isTaken = (seed + slotIndex * 7) % 5 === 0; // ~20% of slots "already booked"
      if (!isTaken) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
  }
  return { source: "mock", date: dateISO, slots };
}

function createMockBooking(payload) {
  const id = `TEST-${Date.now().toString(36).toUpperCase()}`;
  return Promise.resolve({ source: "mock", confirmationId: id });
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
